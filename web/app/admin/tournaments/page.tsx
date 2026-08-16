import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TournamentList } from "@/components/admin/TournamentList";
import { formButtonPrimaryClassName } from "@/lib/form-styles";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <AdminPageHeader
      action={
        <Link
          className={formButtonPrimaryClassName}
          href="/admin/tournaments/new"
        >
          Create Tournament
        </Link>
      }
      description="One draft or live tournament per year. Open a year to manage bears."
      title="Tournaments"
    >
      <TournamentList tournaments={tournaments} />
    </AdminPageHeader>
  );
}
