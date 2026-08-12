import { assertSameOrigin, jsonData, jsonError } from "@/lib/api.server";
import { buildInviteUrl, sendInviteEmail } from "@/lib/email.server";
import { getResendableInvite } from "@/lib/invites.server";
import { userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";
import { getServiceSupabase } from "@/lib/supabase.server";

interface RouteContext {
  params: Promise<{
    inviteId: string;
    poolId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  if (!assertSameOrigin(request)) {
    return jsonError("Invalid request origin.", { status: 403 });
  }

  const { inviteId, poolId } = await context.params;
  const session = await getSession();

  if (!session) {
    return jsonError("Not signed in.", { status: 401 });
  }

  if (
    !(await userCanManagePool({
      isCommissioner: session.isCommissioner,
      poolId,
    }))
  ) {
    return jsonError("Commissioner access required.", { status: 403 });
  }

  const invite = await getResendableInvite({ inviteId, poolId });

  if (!invite) {
    return jsonError("Invite cannot be resent.", { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data: pool } = await supabase
    .from("pools")
    .select("name")
    .eq("id", poolId)
    .maybeSingle();

  const inviteUrl = buildInviteUrl(invite.token);
  const sendResult = await sendInviteEmail({
    expiresAt: invite.expiresAt,
    inviteUrl,
    nameHint: invite.nameHint,
    poolName: (pool?.name as string | undefined) ?? "Fat Bear Week pool",
    to: invite.email,
  });

  return jsonData({
    emailSent: sendResult.emailSent,
    inviteUrl,
  });
}
