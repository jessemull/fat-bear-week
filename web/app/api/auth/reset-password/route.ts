import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { resetPasswordBodySchema } from "@/lib/auth-schemas";
import { consumePasswordReset } from "@/lib/password-reset.server";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { clearSessionCookie, createSession } from "@/lib/sessions.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

const RESET_LIMIT = 10;
const RESET_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const clientIp = getClientIp(request) ?? "unknown";

  if (
    !consumeRateLimit({
      key: `auth:reset-password:ip:${clientIp}`,
      limit: RESET_LIMIT,
      windowMs: RESET_WINDOW_MS,
    })
  ) {
    return jsonError("Too many reset attempts. Try again shortly.", {
      status: 429,
    });
  }

  const parsed = await parseJsonBody(request, resetPasswordBodySchema);

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

  try {
    const result = await consumePasswordReset({
      password: parsed.data.password,
      token: parsed.data.token,
    });

    try {
      await createSession(result.userId);
    } catch (sessionError) {
      console.error("reset-password createSession failed", sessionError);

      try {
        await clearSessionCookie();
      } catch (cookieError) {
        console.error(
          "reset-password clearSessionCookie after createSession failure",
          cookieError,
        );
      }

      return jsonData({
        needsSignIn: true,
      });
    }

    return jsonData({
      needsSignIn: false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "reset_failed";

    if (message === "reset_token_used") {
      return jsonError("This reset link has already been used.", {
        status: 400,
      });
    }

    if (message === "reset_token_expired") {
      return jsonError("This reset link has expired.", { status: 400 });
    }

    if (message === "invalid_reset_token") {
      return jsonError("This reset link is invalid.", { status: 400 });
    }

    console.error("reset-password failed", error);

    return jsonError("Unable to reset password right now.", { status: 500 });
  }
}
