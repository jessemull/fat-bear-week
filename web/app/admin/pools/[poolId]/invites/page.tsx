import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InviteList } from "@/components/pools/InviteList";
import { formButtonPrimaryCompactClassName } from "@/lib/form-styles";
import { listInvitesForPool } from "@/lib/invites.server";
import { getPool, userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface AdminPoolInvitesPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default async function AdminPoolInvitesPage({
  params,
}: AdminPoolInvitesPageProps) {
  const { poolId } = await params;
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

  const invites = await listInvitesForPool(poolId);

  return (
    <AdminPageHeader
      action={
        <Link
          className={formButtonPrimaryCompactClassName}
          href={`/admin/pools/${poolId}/invites/new`}
        >
          Send Invites
        </Link>
      }
      description="Individual invite links. Unused emails stay unique per pool."
      title={`${pool.name} invites`}
    >
      <InviteList invites={invites} poolId={poolId} />
    </AdminPageHeader>
  );
}
