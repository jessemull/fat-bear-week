import {
  AdminPageHeader,
  AdminPageHeaderLinkAction,
} from "@/components/admin/AdminPageHeader";
import { TournamentList } from "@/components/admin/TournamentList";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <AdminPageHeader
      action={
        <AdminPageHeaderLinkAction
          href="/admin/tournaments/new"
          label="Create Tournament"
        />
      }
      description="One draft or live tournament per year. Open a year to manage bears."
      title="Tournaments"
    >
      <TournamentList tournaments={tournaments} />
    </AdminPageHeader>
  );
}
