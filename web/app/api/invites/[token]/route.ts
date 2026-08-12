import { jsonData, jsonError } from "@/lib/api.server";
import { getInviteByToken } from "@/lib/invites.server";

interface RouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  if (!token || token.length < 20) {
    return jsonError("Invite not found.", { status: 404 });
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    return jsonError("Invite not found.", { status: 404 });
  }

  return jsonData({
    email: invite.email,
    expiresAt: invite.expiresAt,
    nameHint: invite.nameHint,
    poolName: invite.poolName,
    status: invite.status,
  });
}
