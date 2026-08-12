import Link from "next/link";

import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { listTournaments } from "@/lib/tournament.server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const tournaments = await listTournaments();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Admin dashboard</h1>
        <p className={formMutedClassName}>
          Manage tournaments, bears, brackets, and pools.
        </p>
      </header>
      <section className="flex flex-wrap gap-4">
        <Link className={formLinkClassName} href="/admin/tournaments">
          Create tournament
        </Link>
        <Link className={formLinkClassName} href="/pools">
          Manage pools
        </Link>
      </section>
      <section className="flex flex-col gap-4">
        <h2 className={`text-xl ${formHeadingClassName}`}>Tournaments</h2>
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
