import type { ReactNode } from "react";

import { PawPrint } from "lucide-react";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { PageStatus } from "@/components/PageStatus";
import { listPoolsForUser } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (!session.isCommissioner) {
    return (
      <PageStatus
        description="Commissioner role required. This den is for rangers only."
        icon={PawPrint}
        title="Closed Den"
      />
    );
  }

  const [pools, tournaments] = await Promise.all([
    listPoolsForUser({
      isCommissioner: true,
      userId: session.id,
    }),
    listTournaments(),
  ]);

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminSidebar
        pools={pools.map((pool) => ({
          id: pool.id,
          name: pool.name,
        }))}
        tournaments={tournaments.map((tournament) => ({
          id: tournament.id,
          status: tournament.status,
          year: tournament.year,
        }))}
      />
      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-3xl flex-col gap-8 text-zinc-900 dark:text-zinc-50">
          {children}
        </div>
      </main>
    </div>
  );
}
