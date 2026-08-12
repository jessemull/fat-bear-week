import Link from "next/link";
import { notFound } from "next/navigation";

import { SetWinnerForm } from "@/components/admin/SetWinnerForm";
import { listBearsForTournament } from "@/lib/bears.server";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listMatchupsForTournament } from "@/lib/matchups.server";
import { getTournament } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface TournamentResultsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentResultsPage({
  params,
}: TournamentResultsPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  const [bears, matchups] = await Promise.all([
    listBearsForTournament(tournamentId),
    listMatchupsForTournament(tournamentId),
  ]);

  const bearNameById = new Map(
    bears.map((bear) => [
      bear.id,
      bear.number !== null ? `#${bear.number} ${bear.name}` : bear.name,
    ]),
  );

  const incomplete = matchups.filter(
    (matchup) =>
      matchup.status !== "complete" &&
      matchup.bearAId !== null &&
      matchup.bearBId !== null,
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link
          className={formLinkClassName}
          href={`/admin/tournaments/${tournament.id}`}
        >
          Back to tournament
        </Link>
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Results · {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Set official winners for incomplete matchups with both bears filled.
        </p>
      </header>
      <section className="flex flex-col gap-6">
        {incomplete.length === 0 ? (
          <p className={formMutedClassName} role="status">
            No incomplete matchups ready for results.
          </p>
        ) : (
          incomplete.map((matchup) => {
            const bearALabel = matchup.bearAId
              ? (bearNameById.get(matchup.bearAId) ?? matchup.bearAId)
              : "TBD";
            const bearBLabel = matchup.bearBId
              ? (bearNameById.get(matchup.bearBId) ?? matchup.bearBId)
              : "TBD";

            return (
              <article
                key={matchup.id}
                className="flex flex-col gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-700"
              >
                <h2 className={`text-lg ${formHeadingClassName}`}>
                  Round {matchup.round} · Pos {matchup.position}
                </h2>
                <p className={formMutedClassName}>
                  {bearALabel} vs {bearBLabel}
                </p>
                <SetWinnerForm
                  bearAId={matchup.bearAId}
                  bearALabel={bearALabel}
                  bearBId={matchup.bearBId}
                  bearBLabel={bearBLabel}
                  matchupId={matchup.id}
                />
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
