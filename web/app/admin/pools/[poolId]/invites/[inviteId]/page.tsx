import { notFound, redirect } from "next/navigation";

import { InviteEditHeader } from "@/components/pools/InviteEditHeader";
import { InviteForm } from "@/components/pools/InviteForm";
import { getInviteForPool } from "@/lib/invites.server";
import { getPool, userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface AdminEditInvitePageProps {
  params: Promise<{
    inviteId: string;
    poolId: string;
  }>;
}

export default async function AdminEditInvitePage({
  params,
}: AdminEditInvitePageProps) {
  const { inviteId, poolId } = await params;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const canManage = await userCanManagePool({
    isCommissioner: session.isCommissioner,
    poolId,
  });

  if (!canManage) {
    notFound();
  }

  const pool = await getPool(poolId);

  if (!pool) {
    notFound();
  }

  const invite = await getInviteForPool({ inviteId, poolId });

  if (!invite) {
    notFound();
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <InviteEditHeader
        description={
          invite.status === "expired"
            ? "Resend to revive this invite with a fresh link and expiry."
            : "Update the invitee or resend the invite email."
        }
        inviteId={invite.id}
        poolId={poolId}
        showResend={
          invite.status === "unused" || invite.status === "expired"
        }
        title={invite.email ?? "Invite"}
      />
      <InviteForm
        invite={{
          email: invite.email,
          id: invite.id,
          nameHint: invite.nameHint,
          status: invite.status,
        }}
        poolId={poolId}
      />
    </div>
  );
}
