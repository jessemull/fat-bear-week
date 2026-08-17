import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { CreatePoolForm } from "@/components/pools/CreatePoolForm";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminNewPoolPage() {
  const tournaments = await listTournaments();

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Tie the pool to a tournament year. Invite friends after it is created."
        title="Create Pool"
      />
      <CreatePoolForm
        tournaments={tournaments.map((tournament) => ({
          id: tournament.id,
          status: tournament.status,
          year: tournament.year,
        }))}
      />
    </div>
  );
}
