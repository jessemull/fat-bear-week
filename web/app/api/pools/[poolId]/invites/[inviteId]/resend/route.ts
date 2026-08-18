import { assertSameOrigin, jsonData, jsonError } from "@/lib/api.server";
import { buildInviteUrl, sendInviteEmail } from "@/lib/email.server";
import { getResendableInvite } from "@/lib/invites.server";
import { requirePoolCommissioner } from "@/lib/pools.server";
import { requireSiteUrl } from "@/lib/site-url";
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
  const auth = await requirePoolCommissioner(poolId);

  if ("error" in auth) {
    return auth.error;
  }

  try {
    requireSiteUrl();
  } catch {
    return jsonError("Site URL is not configured.", { status: 500 });
  }

  let invite;

  try {
    invite = await getResendableInvite({ inviteId, poolId });
  } catch {
    return jsonError("Unable to resend invite.", { status: 500 });
  }

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
    ...(sendResult.emailSent ? {} : { inviteUrl }),
  });
}
