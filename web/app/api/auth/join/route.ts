import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { joinBodySchema } from "@/lib/auth-schemas";
import { joinWithInvite, parseJoinErrorMessage } from "@/lib/auth.server";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { createSession } from "@/lib/sessions.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

const JOIN_LIMIT = 10;
const JOIN_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const clientIp = getClientIp(request) ?? "unknown";

  if (
    !consumeRateLimit({
      key: `auth:join:ip:${clientIp}`,
      limit: JOIN_LIMIT,
      windowMs: JOIN_WINDOW_MS,
    })
  ) {
    return jsonError("Too many join attempts. Try again shortly.", {
      status: 429,
    });
  }

  const parsed = await parseJsonBody(request, joinBodySchema);

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
    const result = await joinWithInvite({
      name: parsed.data.name,
      password: parsed.data.password,
      token: parsed.data.token,
    });

    try {
      await createSession(result.userId);
    } catch {
      return jsonData(
        {
          entryId: result.entryId,
          needsSignIn: true,
          poolId: result.poolId,
          userId: result.userId,
          userName: result.userName,
        },
        { status: 201 },
      );
    }

    return jsonData(
      {
        entryId: result.entryId,
        needsSignIn: false,
        poolId: result.poolId,
        userId: result.userId,
        userName: result.userName,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "join_failed";
    const code = parseJoinErrorMessage(message) ?? message;

    if (code === "invalid_invite" || code === "invalid_name") {
      return jsonError("This invite is invalid.", { status: 400 });
    }

    if (code === "invite_used") {
      return jsonError("This invite has already been used.", { status: 400 });
    }

    if (code === "invite_expired") {
      return jsonError("This invite has expired.", { status: 400 });
    }

    if (code === "name_taken") {
      return jsonError("That display name is already taken.", { status: 409 });
    }

    if (code === "email_taken") {
      return jsonError("An account already exists for this email.", {
        status: 409,
      });
    }

    if (code === "already_in_pool") {
      return jsonError("You already have an entry in this pool.", {
        status: 409,
      });
    }

    if (code === "pool_full") {
      return jsonError("This pool is full.", { status: 409 });
    }

    return jsonError("Unable to join right now.", { status: 500 });
  }
}
