"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { TournamentStatus } from "@/lib/tournament-types";

import { FormSelect } from "@/components/FormSelect";
import { formErrorClassName } from "@/lib/form-styles";

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
      <FormSelect
        disabled={pending}
        id="tournament-status"
        label="Status"
        options={TOURNAMENT_STATUSES.map((option) => ({
          label: option,
          value: option,
        }))}
        value={status}
        valueClassName="capitalize"
        onChange={(nextStatus) =>
          void onChange(nextStatus as TournamentStatus)
        }
      />
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
