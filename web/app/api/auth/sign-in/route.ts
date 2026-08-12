import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { signInBodySchema } from "@/lib/auth-schemas";
import { findUserByName } from "@/lib/auth.server";
import { verifyPassword } from "@/lib/passwords.server";
import { createSession } from "@/lib/sessions.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const parsed = await parseJsonBody(request, signInBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    getClientIp(request),
  );

  if (!turnstileOk) {
    return jsonError("Bot check failed. Please try again.", { status: 400 });
  }

  const user = await findUserByName(parsed.data.name);

  if (!user) {
    return jsonError("Invalid name or password.", { status: 401 });
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);

  if (!valid) {
    return jsonError("Invalid name or password.", { status: 401 });
  }

  await createSession(user.id);

  return jsonData({
    userId: user.id,
    userName: user.name,
  });
}
