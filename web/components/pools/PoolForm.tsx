"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormSelect } from "@/components/FormSelect";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formActionsClassName,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { formatTournamentStatus } from "@/lib/tournament-types";

export interface PoolFormTournamentOption {
  id: string;
  status: string;
  year: number;
}

export interface PoolFormValues {
  bracketDeadline: null | string;
  id: string;
  maxPlayers: number;
  name: string;
  scoringSystem: string;
  showBracketsBeforeLock: boolean;
  tournamentId: string;
}

interface PoolFormProps {
  mode: "create" | "edit";
  pool?: PoolFormValues;
  tournaments: PoolFormTournamentOption[];
}

const SCORING_OPTIONS = [
  {
    label: "Standard (1 / 2 / 4 / 8)",
    value: "standard_1_2_4_8",
  },
];

function toDatetimeLocalValue(iso: null | string): string {
  if (!iso) {
    return "";
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function PoolForm({ mode, pool, tournaments }: PoolFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bracketDeadline, setBracketDeadline] = useState(
    toDatetimeLocalValue(pool?.bracketDeadline ?? null),
  );
  const [error, setError] = useState<null | string>(null);
  const [maxPlayers, setMaxPlayers] = useState(
    String(pool?.maxPlayers ?? 100),
  );
  const [name, setName] = useState(pool?.name ?? "");
  const [pending, setPending] = useState(false);
  const [scoringSystem, setScoringSystem] = useState(
    pool?.scoringSystem ?? "standard_1_2_4_8",
  );
  const [showBracketsBeforeLock, setShowBracketsBeforeLock] = useState(
    pool?.showBracketsBeforeLock ?? false,
  );
  const [tournamentId, setTournamentId] = useState(
    pool?.tournamentId ?? tournaments[0]?.id ?? "",
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedMaxPlayers = Number(maxPlayers);

    if (
      !Number.isInteger(parsedMaxPlayers) ||
      parsedMaxPlayers < 1 ||
      parsedMaxPlayers > 500
    ) {
      setError("Enter a max players value between 1 and 500.");
      return;
    }

    if (!tournamentId) {
      setError("Select a tournament.");
      return;
    }

    setPending(true);

    const body = {
      bracketDeadline: bracketDeadline
        ? new Date(bracketDeadline).toISOString()
        : null,
      maxPlayers: parsedMaxPlayers,
      name: name.trim(),
      scoringSystem,
      showBracketsBeforeLock,
      tournamentId,
    };

    try {
      const response =
        mode === "create"
          ? await fetch("/api/pools", {
              body: JSON.stringify(body),
              headers: { "content-type": "application/json" },
              method: "POST",
            })
          : await fetch(`/api/pools/${pool?.id}`, {
              body: JSON.stringify(body),
              headers: { "content-type": "application/json" },
              method: "PATCH",
            });
      const json = (await response.json()) as {
        data?: { pool?: { id?: string } };
        error?: string;
      };

      if (!response.ok) {
        setError(
          json.error ??
            (mode === "create"
              ? "Unable to create pool."
              : "Unable to save pool."),
        );
        return;
      }

      if (mode === "create") {
        const poolId = json.data?.pool?.id;

        if (poolId) {
          toast("Pool created.");
          router.push(`/admin/pools/${poolId}`);
          router.refresh();
          return;
        }

        toast("Pool created.");
        router.push("/admin/pools");
        router.refresh();
        return;
      }

      toast("Pool saved.");
      router.refresh();
    } catch {
      setError(
        mode === "create"
          ? "Unable to create pool right now."
          : "Unable to save pool right now.",
      );
    } finally {
      setPending(false);
    }
  }

  const tournamentOptions =
    tournaments.length === 0
      ? [{ label: "No tournaments available", value: "" }]
      : tournaments.map((tournament) => ({
          label: `${tournament.year} (${formatTournamentStatus(tournament.status)})`,
          value: tournament.id,
        }));

  const nameId = mode === "create" ? "pool-name" : "edit-pool-name";
  const tournamentFieldId =
    mode === "create" ? "pool-tournament-id" : "edit-pool-tournament-id";
  const maxPlayersId =
    mode === "create" ? "pool-max-players" : "edit-pool-max-players";
  const deadlineId =
    mode === "create" ? "pool-deadline" : "edit-pool-deadline";
  const scoringId =
    mode === "create" ? "pool-scoring" : "edit-pool-scoring";
  const showBracketsId =
    mode === "create" ? "pool-show-brackets" : "edit-pool-show-brackets";

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={nameId}>
          Pool name
        </label>
        <input
          className={formInputClassName}
          id={nameId}
          name="name"
          placeholder="Enter a pool name..."
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={tournamentFieldId}>
          Tournament
        </label>
        <FormSelect
          disabled={pending || tournaments.length === 0}
          id={tournamentFieldId}
          label="Tournament"
          options={tournamentOptions}
          value={tournamentId}
          onChange={setTournamentId}
        />
        {tournaments.length === 0 ? (
          <p className={`text-sm ${formMutedClassName}`} role="status">
            Create a tournament in admin before creating a pool.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={maxPlayersId}>
          Max players
        </label>
        <input
          className={formInputClassName}
          id={maxPlayersId}
          max={500}
          min={1}
          name="maxPlayers"
          placeholder="100"
          required
          type="number"
          value={maxPlayers}
          onChange={(event) => setMaxPlayers(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={scoringId}>
          Scoring system
        </label>
        <FormSelect
          disabled={pending}
          id={scoringId}
          label="Scoring system"
          options={SCORING_OPTIONS}
          value={scoringSystem}
          onChange={setScoringSystem}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={showBracketsId}>
          Bracket visibility
        </label>
        <FormSelect
          disabled={pending}
          id={showBracketsId}
          label="Bracket visibility"
          options={[
            { label: "Hide brackets until lock", value: "hide" },
            { label: "Show brackets before lock", value: "show" },
          ]}
          value={showBracketsBeforeLock ? "show" : "hide"}
          onChange={(value) => setShowBracketsBeforeLock(value === "show")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor={deadlineId}>
          Bracket deadline
        </label>
        <input
          className={`${formInputClassName} datetime-local-input`}
          id={deadlineId}
          name="bracketDeadline"
          type="datetime-local"
          value={bracketDeadline}
          onChange={(event) => setBracketDeadline(event.target.value)}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <div className={formActionsClassName}>
        <button
          className={`${formButtonSecondaryClassName} w-full justify-center`}
          disabled={pending}
          type="button"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button
          className={`${formButtonPrimaryClassName} w-full justify-center`}
          disabled={pending || !tournamentId}
          type="submit"
        >
          {pending ? (
            <ButtonPendingLabel>
              {mode === "create" ? "Creating…" : "Saving…"}
            </ButtonPendingLabel>
          ) : mode === "create" ? (
            "Create Pool"
          ) : (
            "Save Pool"
          )}
        </button>
      </div>
    </FormShell>
  );
}
