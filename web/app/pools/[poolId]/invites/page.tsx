import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { InviteList } from "@/components/pools/InviteList";
import { MintInviteForm } from "@/components/pools/MintInviteForm";
import {
  formHeadingClassName,
  formLinkClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { listInvitesForPool } from "@/lib/invites.server";
import { userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface PoolInvitesPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default async function PoolInvitesPage({
  params,
}: PoolInvitesPageProps) {
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
    return (
      <main className={`${formPageClassName} max-w-lg justify-center`}>
        <h1 className={`text-2xl ${formHeadingClassName}`}>
          Commissioner access required
        </h1>
        <Link className={formLinkClassName} href="/pools">
          Back to pools
        </Link>
      </main>
    );
  }

  const invites = await listInvitesForPool(poolId);

  return (
    <main className={formPageClassName}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link className={`text-sm ${formLinkClassName}`} href="/pools">
            Back to pools
          </Link>
          <h1 className={`text-3xl ${formHeadingClassName}`}>Invites</h1>
        </div>
        <SignOutButton />
      </header>
      <section className="flex flex-col gap-4">
        <h2 className={`text-xl ${formHeadingClassName}`}>Send an invite</h2>
        <MintInviteForm poolId={poolId} />
      </section>
      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>Invite status</h2>
        <InviteList invites={invites} poolId={poolId} />
      </section>
    </main>
  );
}
