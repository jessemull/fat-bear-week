import { TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DeleteTournamentButton } from "@/components/admin/DeleteTournamentButton";
import { TournamentStatusControls } from "@/components/admin/TournamentStatusControls";
import {
  formHeadingClassName,
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
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Manage status and bears for this year."
        title={`Tournament ${tournament.year}`}
      />
      <div className="flex flex-col">
        <section className="flex flex-col gap-2">
          <h2 className={`text-xl ${formHeadingClassName}`}>Status</h2>
          <p className={`text-sm ${formMutedClassName}`}>
            Current lifecycle for this tournament year.
          </p>
          <div className="mt-2">
            <TournamentStatusControls
              status={tournament.status}
              tournamentId={tournament.id}
            />
          </div>
        </section>
        <section className="mt-6 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
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
          <div className="mt-2">
            <DeleteTournamentButton
              tournamentId={tournament.id}
              year={tournament.year}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
