import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BearList } from "@/components/admin/BearList";
import { listBearsForTournament } from "@/lib/bears.server";
import { formButtonPrimaryCompactClassName } from "@/lib/form-styles";
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
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        action={
          <Link
            className={formButtonPrimaryCompactClassName}
            href={`/admin/tournaments/${tournament.id}/bears/new`}
          >
            Create Bear
          </Link>
        }
        description="Shared catalog of bears for this tournament year."
        title={`Bears · ${tournament.year}`}
      />
      <BearList bears={bears} tournamentId={tournament.id} />
    </div>
  );
}
