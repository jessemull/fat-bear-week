import { notFound, redirect } from "next/navigation";

import { SendInvitesPanel } from "@/components/pools/SendInvitesPanel";
import { getPool, userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface AdminNewInvitesPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default async function AdminNewInvitesPage({
  params,
}: AdminNewInvitesPageProps) {
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

  return <SendInvitesPanel poolId={poolId} />;
}
