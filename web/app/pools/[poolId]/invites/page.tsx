import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface PoolInvitesRedirectPageProps {
  params: Promise<{
    poolId: string;
  }>;
}

export default async function PoolInvitesRedirectPage({
  params,
}: PoolInvitesRedirectPageProps) {
  const { poolId } = await params;

  redirect(`/admin/pools/${poolId}/invites`);
}
