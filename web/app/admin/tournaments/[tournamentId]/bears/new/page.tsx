import { notFound } from "next/navigation";

import { BearForm } from "@/components/admin/BearForm";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getTournament } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface NewBearPageProps {
  params: Promise<{
    tournamentId: string;
  }>;
}

export default async function NewBearPage({ params }: NewBearPageProps) {
  const { tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Create Bear</h1>
        <p className={formMutedClassName}>
          Add a bear to the shared catalog for {tournament.year}.
        </p>
      </header>
      <BearForm mode="create" tournamentId={tournament.id} />
    </div>
  );
}
