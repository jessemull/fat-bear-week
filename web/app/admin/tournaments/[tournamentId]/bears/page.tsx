import Link from "next/link";
import { notFound } from "next/navigation";

import { BearList } from "@/components/admin/BearList";
import { listBearsForTournament } from "@/lib/bears.server";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getTournament } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface TournamentBearsPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function TournamentBearsPage({
  params,
}: TournamentBearsPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  const bears = await listBearsForTournament(tournamentId);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Bears · {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Shared catalog of bears for this tournament year.
        </p>
        <Link
          className={`text-sm ${formLinkClassName}`}
          href={`/admin/tournaments/${tournament.id}`}
        >
          Back to Tournament
        </Link>
        <Link
          className={`text-sm ${formLinkClassName}`}
          href={`/admin/tournaments/${tournament.id}/bears/new`}
        >
          Create Bear
        </Link>
      </header>
      <BearList bears={bears} tournamentId={tournament.id} />
    </div>
  );
}
