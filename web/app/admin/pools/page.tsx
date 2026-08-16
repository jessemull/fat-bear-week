import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PoolList } from "@/components/pools/PoolList";
import { formButtonPrimaryCompactClassName } from "@/lib/form-styles";
import { listPoolsForUser } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function AdminPoolsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pools = await listPoolsForUser({
    isCommissioner: true,
    userId: session.id,
  });

  return (
    <AdminPageHeader
      action={
        <Link
          className={formButtonPrimaryCompactClassName}
          href="/admin/pools/new"
        >
          Create Pool
        </Link>
      }
      description="One pool per tournament for v1. Manage invites from each pool."
      title="Pools"
    >
      <PoolList pools={pools} />
    </AdminPageHeader>
  );
}
