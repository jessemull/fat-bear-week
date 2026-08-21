import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { forgotPasswordBodySchema } from "@/lib/auth-schemas";
import {
  isEmailConfigured,
  sendPasswordResetEmail,
} from "@/lib/email.server";
import {
  buildPasswordResetUrl,
  issuePasswordReset,
} from "@/lib/password-reset.server";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

const FORGOT_LIMIT = 10;
const FORGOT_WINDOW_MS = 60_000;

const GENERIC_OK = { ok: true as const };

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const clientIp = getClientIp(request) ?? "unknown";

  if (
    !consumeRateLimit({
      key: `auth:forgot-password:ip:${clientIp}`,
      limit: FORGOT_LIMIT,
      windowMs: FORGOT_WINDOW_MS,
    })
  ) {
    return jsonError("Too many reset requests. Try again shortly.", {
      status: 429,
    });
  }

  const parsed = await parseJsonBody(request, forgotPasswordBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    clientIp === "unknown" ? null : clientIp,
  );

  if (!turnstileOk) {
    return jsonError("Bot check failed. Please try again.", { status: 400 });
  }

  const emailKey = parsed.data.email.trim().toLowerCase();

  if (
    !consumeRateLimit({
      key: `auth:forgot-password:email:${emailKey}`,
      limit: 5,
      windowMs: FORGOT_WINDOW_MS,
    })
  ) {
    return jsonError("Too many reset requests. Try again shortly.", {
      status: 429,
    });
  }

  if (!isEmailConfigured()) {
    return jsonError("Unable to send reset email right now.", { status: 503 });
  }

  try {
    const issued = await issuePasswordReset(parsed.data.email);

    if (issued) {
      const result = await sendPasswordResetEmail({
        expiresAt: issued.expiresAt,
        name: issued.name,
        resetUrl: buildPasswordResetUrl(issued.token),
        to: issued.to,
      });

      if (!result.emailSent) {
        console.error("forgot-password send failed");
      }
    }
  } catch (error) {
    console.error("forgot-password issue failed", error);
  }

  return jsonData(GENERIC_OK);
}
