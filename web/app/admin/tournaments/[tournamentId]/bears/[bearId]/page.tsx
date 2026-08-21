import { TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BearForm } from "@/components/admin/BearForm";
import { DeleteBearButton } from "@/components/admin/DeleteBearButton";
import { getBear } from "@/lib/bears.server";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getTournament } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

interface EditBearPageProps {
  params: Promise<{
    bearId: string;
    tournamentId: string;
  }>;
}

export default async function EditBearPage({ params }: EditBearPageProps) {
  const { bearId, tournamentId } = await params;
  const tournament = await getTournament(tournamentId);

  if (!tournament) {
    notFound();
  }

  const bear = await getBear(bearId);

  if (!bear) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <AdminPageHeader
        description="Edit identification and biography for this catalog bear."
        title={bear.name}
      />
      <div className="flex flex-col">
        <BearForm
          bear={{
            biography: bear.biography,
            id: bear.id,
            identification: bear.identification,
            name: bear.name,
            nickname: bear.nickname,
          }}
          mode="edit"
          tournamentId={tournament.id}
        />
        <section className="mt-5 flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <h2
            className={`flex items-center gap-2 text-xl ${formHeadingClassName}`}
          >
            <TriangleAlert
              aria-hidden="true"
              className="size-5 text-red-600/80 dark:text-red-600/80"
              strokeWidth={1.75}
            />
            Danger Zone
          </h2>
          <p className={`text-sm ${formMutedClassName}`}>
            Delete only when this bear is not used in any matchup.
          </p>
          <div className="mt-2">
            <DeleteBearButton
              bearId={bear.id}
              bearName={bear.name}
              tournamentId={tournament.id}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
