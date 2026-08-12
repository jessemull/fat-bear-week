import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BearForm } from "@/components/admin/BearForm";
import { DeleteBearButton } from "@/components/admin/DeleteBearButton";
import { getBear } from "@/lib/bears.server";
import {
  formHeadingClassName,
  formLinkClassName,
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
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>{bear.name}</h1>
        <p className={formMutedClassName}>
          Edit identification and biography for this catalog bear.
        </p>
        <Link
          className={`text-sm ${formLinkClassName}`}
          href={`/admin/tournaments/${tournament.id}/bears`}
        >
          Back to Bears
        </Link>
      </header>
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
          Delete only when this bear is not used in any matchup.
        </p>
        <DeleteBearButton
          bearId={bear.id}
          name={bear.name}
          tournamentId={tournament.id}
        />
      </section>
    </div>
  );
}
