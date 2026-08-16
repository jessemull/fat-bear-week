import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InviteList } from "@/components/pools/InviteList";
import { MintInviteForm } from "@/components/pools/MintInviteForm";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listInvitesForPool } from "@/lib/invites.server";
import { userCanManagePool } from "@/lib/pools.server";
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

  const invites = await listInvitesForPool(poolId);

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Send individual invite links. Unused emails stay unique per pool."
        title="Invites"
      />
      <section className="flex flex-col gap-2">
        <h2 className={`text-xl ${formHeadingClassName}`}>Send an invite</h2>
        <p className={`text-sm ${formMutedClassName}`}>
          Recipients join with the emailed link.
        </p>
        <div className="mt-2">
          <MintInviteForm poolId={poolId} />
        </div>
      </section>
      <section className="mt-4 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>Invite status</h2>
        <InviteList invites={invites} poolId={poolId} />
      </section>
    </div>
  );
}
