import Link from "next/link";

import { CreateTournamentForm } from "@/components/admin/CreateTournamentForm";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminTournamentsPage() {
  const tournaments = await listTournaments();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Tournaments</h1>
        <p className={formMutedClassName}>
          Create a draft tournament year, then manage bears and brackets.
        </p>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className={`text-xl ${formHeadingClassName}`}>Create</h2>
        <CreateTournamentForm />
      </section>
      <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className={`text-xl ${formHeadingClassName}`}>All tournaments</h2>
        {tournaments.length === 0 ? (
          <p className={formMutedClassName} role="status">
            No tournaments yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tournaments.map((tournament) => (
              <li key={tournament.id}>
                <Link
                  className={formLinkClassName}
                  href={`/admin/tournaments/${tournament.id}`}
                >
                  {tournament.year} ({tournament.status})
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
