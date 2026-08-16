import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TournamentList } from "@/components/admin/TournamentList";
import { formButtonPrimaryCompactClassName } from "@/lib/form-styles";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        action={
          <Link
            className={formButtonPrimaryCompactClassName}
            href="/admin/tournaments/new"
          >
            Create Tournament
          </Link>
        }
        description="One draft or live tournament per year. Open a year to manage bears."
        title="Tournaments"
      />
      <TournamentList tournaments={tournaments} />
    </div>
  );
}
