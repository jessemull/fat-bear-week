import { changeAccountPassword } from "@/lib/account.server";
import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { changePasswordBodySchema } from "@/lib/auth-schemas";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { getSession } from "@/lib/sessions.server";
import { getClientIp } from "@/lib/turnstile.server";

const CHANGE_LIMIT = 10;
const CHANGE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  const clientIp = getClientIp(request) ?? "unknown";

  if (
    !consumeRateLimit({
      key: `auth:account-password:ip:${clientIp}`,
      limit: CHANGE_LIMIT,
      windowMs: CHANGE_WINDOW_MS,
    })
  ) {
    return jsonError("Too many password changes. Try again shortly.", {
      status: 429,
    });
  }

  const parsed = await parseJsonBody(request, changePasswordBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  if (
    !consumeRateLimit({
      key: `auth:account-password:user:${session.id}`,
      limit: 5,
      windowMs: CHANGE_WINDOW_MS,
    })
  ) {
    return jsonError("Too many password changes. Try again shortly.", {
      status: 429,
    });
  }

  try {
    await changeAccountPassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.password,
      userId: session.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "change_failed";

    if (message === "invalid_credentials") {
      return jsonError("Current password is incorrect.", { status: 401 });
    }

    console.error("account password change failed", error);

    return jsonError("Unable to change password right now.", { status: 500 });
  }

  return jsonData({ ok: true });
}
