import Link from "next/link";
import { notFound } from "next/navigation";

import { BearForm } from "@/components/admin/BearForm";
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
        <Link
          className={formLinkClassName}
          href={`/admin/tournaments/${tournament.id}`}
        >
          Back to tournament
        </Link>
        <h1 className={`text-3xl ${formHeadingClassName}`}>
          Bears · {tournament.year}
        </h1>
        <p className={formMutedClassName}>
          Bears are a shared catalog used when seeding the bracket.
        </p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className={`text-xl ${formHeadingClassName}`}>Add bear</h2>
        <BearForm tournamentId={tournament.id} />
      </section>
      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>Catalog</h2>
        <BearList bears={bears} />
      </section>
    </div>
  );
}
