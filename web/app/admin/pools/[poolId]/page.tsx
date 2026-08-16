import { TriangleAlert } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeletePoolButton } from "@/components/pools/DeletePoolButton";
import { PoolForm } from "@/components/pools/PoolForm";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getPool, userCanManagePool } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface AdminPoolPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default async function AdminPoolPage({ params }: AdminPoolPageProps) {
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

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Update pool settings and manage invites from the sidebar."
        title={pool.name}
      />
      <div className="flex flex-col">
        <section className="flex flex-col gap-2">
          <h2 className={`text-xl ${formHeadingClassName}`}>Settings</h2>
          <p className={`text-sm ${formMutedClassName}`}>
            Name, tournament year, capacity, and bracket deadline.
          </p>
          <div className="mt-2">
            <PoolForm
              mode="edit"
              pool={{
                bracketDeadline: pool.bracketDeadline,
                id: pool.id,
                maxPlayers: pool.maxPlayers,
                name: pool.name,
                tournamentId: pool.tournamentId,
              }}
            />
          </div>
        </section>
        <section className="mt-6 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <h2
            className={`flex items-center gap-2 text-xl ${formHeadingClassName}`}
          >
            <TriangleAlert
              aria-hidden="true"
              className="size-5 text-red-700 dark:text-red-400"
              strokeWidth={1.75}
            />
            Danger Zone
          </h2>
          <p className={`text-sm ${formMutedClassName}`}>
            Deleting a pool also removes its invites and player entries.
          </p>
          <div className="mt-2">
            <DeletePoolButton name={pool.name} poolId={pool.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
