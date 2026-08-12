import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  formHeadingClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

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

  return (
    <main className={formPageClassName}>
      <AdminNav />
      {children}
    </main>
  );
}
