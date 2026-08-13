import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import {
  formHeadingClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
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
      <main className={formPageClassName}>
        <h1 className={`text-2xl ${formHeadingClassName}`}>Forbidden</h1>
        <p className={formMutedClassName}>
          Commissioner access is required for the admin area.
        </p>
      </main>
    );
  }

  const tournaments = await listTournaments();

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminSidebar
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
