import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { TournamentStatusControls } from "@/components/admin/TournamentStatusControls";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import {
  allowedTournamentStatuses,
  getTournament,
} from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface TournamentDetailPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentDetailPage({
  params,
}: TournamentDetailPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  const nextStatuses = allowedTournamentStatuses(tournament.status);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link className={formLinkClassName} href="/admin/tournaments">
          Back to tournaments
        </Link>
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Tournament {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Status:{" "}
          <span className="font-medium uppercase tracking-wide">
            {tournament.status}
          </span>
        </p>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className={`text-xl ${formHeadingClassName}`}>Status</h2>
        <p className={`text-sm ${formMutedClassName}`}>
          You can move to any status, including reverting from complete.
        </p>
        <TournamentStatusControls
          nextStatuses={nextStatuses}
          tournamentId={tournament.id}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className={`text-xl ${formHeadingClassName}`}>Manage</h2>
        <ul className="flex flex-col gap-2">
          <li>
            <Link
              className={formLinkClassName}
              href={`/admin/tournaments/${tournament.id}/bears`}
            >
              Bears
            </Link>
          </li>
          <li>
            <Link
              className={formLinkClassName}
              href={`/admin/tournaments/${tournament.id}/bracket`}
            >
              Bracket
            </Link>
          </li>
          <li>
            <Link
              className={formLinkClassName}
              href={`/admin/tournaments/${tournament.id}/results`}
            >
              Results
            </Link>
          </li>
        </ul>
      </section>
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>Danger zone</h2>
        <p className={`text-sm ${formMutedClassName}`}>
          Delete only when no pools reference this tournament. One tournament
          per year remains enforced.
        </p>
        <DeleteTournamentButton
          tournamentId={tournament.id}
          year={tournament.year}
        />
      </section>
    </div>
  );
}
