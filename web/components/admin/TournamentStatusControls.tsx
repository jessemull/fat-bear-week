"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TournamentStatus } from "@/lib/tournament-types";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
} from "@/lib/form-styles";

interface TournamentStatusControlsProps {
  nextStatuses: TournamentStatus[];
  tournamentId: string;
}

export function TournamentStatusControls({
  nextStatuses,
  tournamentId,
}: TournamentStatusControlsProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pendingStatus, setPendingStatus] = useState<null | TournamentStatus>(
    null,
  );

  async function transition(status: TournamentStatus) {
    setError(null);
    setPendingStatus(status);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/status`,
        {
          body: JSON.stringify({ status }),
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
      setPendingStatus(null);
    }
  }

  if (nextStatuses.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400" role="status">
        No further status transitions.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => (
          <button
            key={status}
            className={formButtonPrimaryClassName}
            disabled={pendingStatus !== null}
            type="button"
            onClick={() => void transition(status)}
          >
            {pendingStatus === status
              ? `Moving to ${status}…`
              : `Mark ${status}`}
          </button>
        ))}
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
