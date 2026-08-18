import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InviteForm } from "@/components/pools/InviteForm";
import { ResendInviteButton } from "@/components/pools/ResendInviteButton";
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
      <AdminPageHeader
        action={
          invite.status === "unused" || invite.status === "expired" ? (
            <ResendInviteButton inviteId={invite.id} poolId={poolId} />
          ) : undefined
        }
        description={
          invite.status === "expired"
            ? "Resend to revive this invite with a fresh link and expiry."
            : "Update the invitee or resend the invite email."
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
