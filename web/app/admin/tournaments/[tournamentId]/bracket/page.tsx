import Link from "next/link";
import { notFound } from "next/navigation";

import { BracketSeedForm } from "@/components/admin/BracketSeedForm";
import { listBearsForTournament } from "@/lib/bears.server";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listMatchupsForTournament } from "@/lib/matchups.server";
import { getTournament } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface TournamentBracketPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentBracketPage({
  params,
}: TournamentBracketPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  const [bears, matchups] = await Promise.all([
    listBearsForTournament(tournamentId),
    listMatchupsForTournament(tournamentId),
  ]);

  const bearNameById = new Map(bears.map((bear) => [bear.id, bear.name]));

  const rounds = [...new Set(matchups.map((matchup) => matchup.round))].sort(
    (a, b) => a - b,
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
          Bracket · {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Seed while the tournament is draft. Existing matchups are replaced.
        </p>
      </header>
      {tournament.status === "draft" ? (
        <section className="flex flex-col gap-4">
          <h2 className={`text-xl ${formHeadingClassName}`}>Seed bracket</h2>
          <BracketSeedForm bears={bears} tournamentId={tournament.id} />
        </section>
      ) : (
        <p className={formMutedClassName} role="status">
          Bracket seeding is only available while status is draft.
        </p>
      )}
      <section className="flex flex-col gap-6 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>Matchups</h2>
        {matchups.length === 0 ? (
          <p className={formMutedClassName} role="status">
            No matchups yet.
          </p>
        ) : (
          rounds.map((round) => (
            <div key={round} className="flex flex-col gap-3">
              <h3 className={`text-lg ${formHeadingClassName}`}>
                Round {round}
              </h3>
              <ul className="flex flex-col gap-2">
                {matchups
                  .filter((matchup) => matchup.round === round)
                  .map((matchup) => {
                    const bearA = matchup.bearAId
                      ? (bearNameById.get(matchup.bearAId) ?? matchup.bearAId)
                      : "TBD";
                    const bearB = matchup.bearBId
                      ? (bearNameById.get(matchup.bearBId) ?? matchup.bearBId)
                      : "TBD";
                    const winner = matchup.winnerId
                      ? (bearNameById.get(matchup.winnerId) ??
                        matchup.winnerId)
                      : null;

                    return (
                      <li
                        key={matchup.id}
                        className="border-b border-zinc-200 pb-2 text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
                      >
                        <p>
                          Pos {matchup.position}: {bearA} vs {bearB}
                        </p>
                        <p className={`text-sm ${formMutedClassName}`}>
                          {matchup.status}
                          {winner ? ` · winner ${winner}` : ""}
                        </p>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
