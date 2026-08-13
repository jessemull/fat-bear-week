"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TournamentStatus } from "@/lib/tournament-types";

import {
  formErrorClassName,
  formSelectClassName,
} from "@/lib/form-styles";

const TOURNAMENT_STATUSES: TournamentStatus[] = [
  "complete",
  "draft",
  "live",
  "locked",
];

interface TournamentStatusControlsProps {
  status: TournamentStatus;
  tournamentId: string;
}

export function TournamentStatusControls({
  status,
  tournamentId,
}: TournamentStatusControlsProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onChange(nextStatus: TournamentStatus) {
    if (nextStatus === status) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/status`,
        {
          body: JSON.stringify({ status: nextStatus }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      );
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to update status.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update status right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex max-w-xs flex-col gap-3">
      <div className="relative">
        <select
          aria-label="Status"
          className={`${formSelectClassName} capitalize`}
          disabled={pending}
          id="tournament-status"
          value={status}
          onChange={(event) =>
            void onChange(event.target.value as TournamentStatus)
          }
        >
          {TOURNAMENT_STATUSES.map((option) => (
            <option key={option} className="capitalize" value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 size-3.5 -translate-y-1/2 text-zinc-700 dark:text-zinc-300"
          strokeWidth={1.75}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
