import {
  assertSameOrigin,
  jsonData,
  jsonError,
  parseJsonBody,
} from "@/lib/api.server";
import { updateInviteBodySchema } from "@/lib/auth-schemas";
import { getInviteForPool, updateInvite } from "@/lib/invites.server";
import { requirePoolCommissioner } from "@/lib/pools.server";

interface RouteContext {
  params: Promise<{
    inviteId: string;
    poolId: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { inviteId, poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    const invite = await getInviteForPool({ inviteId, poolId });

    if (!invite) {
      return jsonError("Invite not found.", { status: 404 });
    }

    return jsonData({ invite });
  } catch {
    return jsonError("Unable to load invite.", { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const { inviteId, poolId } = await context.params;
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  const parsed = await parseJsonBody(request, updateInviteBodySchema);

  if ("error" in parsed) {
    return parsed.error;
  }

  try {
    const invite = await updateInvite({
      email: parsed.data.email,
      inviteId,
      nameHint: parsed.data.nameHint ?? null,
      poolId,
    });

    return jsonData({
      invite,
      tokenRotated: invite.tokenRotated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "not_found") {
      return jsonError("Invite not found.", { status: 404 });
    }

    if (message === "invite_used") {
      return jsonError("Used invites cannot be edited.", { status: 400 });
    }

    if (message === "email_invited") {
      return jsonError("An unused invite already exists for that email.", {
        status: 409,
      });
    }

    return jsonError("Unable to update invite.", { status: 500 });
  }
}
