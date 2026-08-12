"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent } from "react";

import type { TournamentRecord } from "@/lib/tournament.server";

import { formMutedClassName } from "@/lib/form-styles";

interface TournamentListProps {
  tournaments: TournamentRecord[];
}

function formatDate(value: null | string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function TournamentList({ tournaments }: TournamentListProps) {
  const router = useRouter();

  if (tournaments.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No tournaments yet.
      </p>
    );
  }

  function openTournament(tournamentId: string) {
    router.push(`/admin/tournaments/${tournamentId}`);
  }

  function onRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    tournamentId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTournament(tournamentId);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300 dark:border-zinc-600">
            <th className={`py-2 pl-3 pr-4 font-medium ${formMutedClassName}`}>
              Year
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Status
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Starts
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Ends
            </th>
            <th className="w-10 py-2 pr-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tournaments.map((tournament) => (
            <tr
              key={tournament.id}
              aria-label={`Open tournament ${tournament.year}`}
              className="group cursor-pointer border-b border-zinc-200 transition-colors hover:bg-amber-50/80 focus-visible:bg-amber-50/80 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
              role="link"
              tabIndex={0}
              onClick={() => openTournament(tournament.id)}
              onKeyDown={(event) => onRowKeyDown(event, tournament.id)}
            >
              <td className="py-3 pl-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {tournament.year}
              </td>
              <td className="py-3 pr-4 capitalize text-zinc-700 dark:text-zinc-300">
                {tournament.status}
              </td>
              <td className={`py-3 pr-4 ${formMutedClassName}`}>
                {formatDate(tournament.startsAt)}
              </td>
              <td className={`py-3 pr-4 ${formMutedClassName}`}>
                {formatDate(tournament.endsAt)}
              </td>
              <td className="py-3 pr-3">
                <span className="flex justify-end">
                  <ExternalLink
                    aria-hidden="true"
                    className="size-4 text-amber-800 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-amber-400"
                    strokeWidth={1.75}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
