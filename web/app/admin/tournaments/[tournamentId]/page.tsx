import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { TournamentStatusControls } from "@/components/admin/TournamentStatusControls";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getTournament } from "@/lib/tournament.server";

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

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Tournament {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Manage status and bears for this year.
        </p>
        <Link
          className={`text-sm ${formLinkClassName}`}
          href="/admin/tournaments"
        >
          Back to Tournaments
        </Link>
      </header>
      <section className="flex flex-col gap-3">
        <h2 className={`text-xl ${formHeadingClassName}`}>Status</h2>
        <p className={`text-sm ${formMutedClassName}`}>
          Current lifecycle for this tournament year.
        </p>
        <TournamentStatusControls
          status={tournament.status}
          tournamentId={tournament.id}
        />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className={`text-xl ${formHeadingClassName}`}>Bears</h2>
        <p className={`text-sm ${formMutedClassName}`}>
          Add and edit the catalog for this tournament year.
        </p>
        <Link
          className={`text-sm ${formLinkClassName}`}
          href={`/admin/tournaments/${tournament.id}/bears`}
        >
          Manage Bears
        </Link>
      </section>
      <section className="flex flex-col gap-3 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2
          className={`flex items-center gap-2 text-xl ${formHeadingClassName}`}
        >
          <TriangleAlert
            aria-hidden="true"
            className="size-5 text-red-700 dark:text-red-400"
            strokeWidth={1.75}
          />
          Danger Zone
        </h2>
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
