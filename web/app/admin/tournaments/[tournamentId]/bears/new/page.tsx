import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BearForm } from "@/components/admin/BearForm";
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
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description={`Add a bear to the shared catalog for ${tournament.year}.`}
        title="Create Bear"
      />
      <BearForm mode="create" tournamentId={tournament.id} />
    </div>
  );
}
