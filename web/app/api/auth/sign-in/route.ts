import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { signInBodySchema } from "@/lib/auth-schemas";
import { findUserByLoginIdentifier } from "@/lib/auth.server";
import { hashPassword, verifyPassword } from "@/lib/passwords.server";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { createSession } from "@/lib/sessions.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

const SIGN_IN_LIMIT = 20;
const SIGN_IN_WINDOW_MS = 60_000;

let dummyPasswordHashPromise: null | Promise<string> = null;

function getDummyPasswordHash(): Promise<string> {
  if (!dummyPasswordHashPromise) {
    dummyPasswordHashPromise = hashPassword("timing-parity-dummy-password");
  }

  return dummyPasswordHashPromise;
}

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const clientIp = getClientIp(request) ?? "unknown";
  const parsed = await parseJsonBody(request, signInBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  const identifierKey = parsed.data.identifier.trim().toLowerCase();

  if (
    !consumeRateLimit({
      key: `auth:sign-in:ip:${clientIp}`,
      limit: SIGN_IN_LIMIT,
      windowMs: SIGN_IN_WINDOW_MS,
    }) ||
    !consumeRateLimit({
      key: `auth:sign-in:id:${identifierKey}`,
      limit: 10,
      windowMs: SIGN_IN_WINDOW_MS,
    })
  ) {
    return jsonError("Too many sign-in attempts. Try again shortly.", {
      status: 429,
    });
  }

  const turnstileOk = await verifyTurnstileToken(
    parsed.data.turnstileToken,
    clientIp === "unknown" ? null : clientIp,
  );

  if (!turnstileOk) {
    return jsonError("Bot check failed. Please try again.", { status: 400 });
  }

  const user = await findUserByLoginIdentifier(parsed.data.identifier);
  const passwordHash = user?.passwordHash ?? (await getDummyPasswordHash());
  const valid = await verifyPassword(parsed.data.password, passwordHash);

  if (!user || !valid) {
    return jsonError("Invalid name, email, or password.", { status: 401 });
  }

  await createSession(user.id);

  return jsonData({
    userId: user.id,
    userName: user.name,
  });
}
