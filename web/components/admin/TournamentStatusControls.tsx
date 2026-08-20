"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormSelect } from "@/components/FormSelect";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import { formErrorClassName } from "@/lib/form-styles";
import {
  formatTournamentStatus,
  type TournamentStatus,
} from "@/lib/tournament-types";

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
  const { toast } = useToast();
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

      toast("Status updated.");
      router.refresh();
    } catch {
      setError("Unable to update status right now.");
    } finally {
      setPending(false);
    }
  }

  const options = pending
    ? [{ label: "Updating…", value: "" }]
    : TOURNAMENT_STATUSES.map((option) => ({
        label: formatTournamentStatus(option),
        value: option,
      }));

  return (
    <FormShell>
      <FormSelect
        disabled={pending}
        id="tournament-status"
        label="Status"
        options={options}
        value={pending ? "" : status}
        onChange={(nextStatus) =>
          void onChange(nextStatus as TournamentStatus)
        }
      />
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </FormShell>
  );
}
