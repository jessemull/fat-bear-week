import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { joinBodySchema } from "@/lib/auth-schemas";
import { joinWithInvite, parseJoinErrorMessage } from "@/lib/auth.server";
import { createSession } from "@/lib/sessions.server";
import { getClientIp, verifyTurnstileToken } from "@/lib/turnstile.server";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const parsed = await parseJsonBody(request, joinBodySchema);

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

  try {
    const result = await joinWithInvite({
      name: parsed.data.name,
      password: parsed.data.password,
      token: parsed.data.token,
    });

    await createSession(result.userId);

    return jsonData(
      {
        entryId: result.entryId,
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
