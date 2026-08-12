import Link from "next/link";

import { TournamentList } from "@/components/admin/TournamentList";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Tournaments</h1>
        <p className={formMutedClassName}>
          One draft or live tournament per year. Open a year to manage bears and
          brackets.
        </p>
        <Link className={`text-sm ${formLinkClassName}`} href="/admin/tournaments/new">
          Create Tournament
        </Link>
      </header>
      <TournamentList tournaments={tournaments} />
    </div>
  );
}
