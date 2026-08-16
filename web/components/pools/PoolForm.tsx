"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { FormSelect } from "@/components/FormSelect";
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

export interface PoolFormValues {
  bracketDeadline: null | string;
  id: string;
  maxPlayers: number;
  name: string;
  tournamentId: string;
}

interface PoolFormProps {
  mode: "create" | "edit";
  pool?: PoolFormValues;
}

interface TournamentOption {
  id: string;
  status: string;
  year: number;
}

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

export function PoolForm({ mode, pool }: PoolFormProps) {
  const router = useRouter();
  const [bracketDeadline, setBracketDeadline] = useState(
    toDatetimeLocalValue(pool?.bracketDeadline ?? null),
  );
  const [error, setError] = useState<null | string>(null);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [maxPlayers, setMaxPlayers] = useState(
    String(pool?.maxPlayers ?? 100),
  );
  const [name, setName] = useState(pool?.name ?? "");
  const [pending, setPending] = useState(false);
  const [tournamentId, setTournamentId] = useState(pool?.tournamentId ?? "");
  const [tournaments, setTournaments] = useState<TournamentOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadTournaments() {
      try {
        const response = await fetch("/api/admin/tournaments");
        const json = (await response.json()) as {
          data?: { tournaments: TournamentOption[] };
          error?: string;
        };

        if (!response.ok || !json.data) {
          if (!cancelled) {
            setLoadError(json.error ?? "Unable to load tournaments.");
          }

          return;
        }

        if (!cancelled) {
          setTournaments(json.data.tournaments);
          setTournamentId((current) => {
            if (current) {
              return current;
            }

            return json.data?.tournaments[0]?.id ?? "";
          });
        }
      } catch {
        if (!cancelled) {
          setLoadError("Unable to load tournaments right now.");
        }
      }
    }

    void loadTournaments();

    return () => {
      cancelled = true;
    };
  }, []);

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

    setPending(true);

    const body = {
      bracketDeadline: bracketDeadline
        ? new Date(bracketDeadline).toISOString()
        : null,
      maxPlayers: parsedMaxPlayers,
      name: name.trim(),
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
        data?: { id?: string; pool?: { id?: string } };
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
        const poolId = json.data?.id;

        if (poolId) {
          router.push(`/admin/pools/${poolId}`);
          router.refresh();
          return;
        }

        router.push("/admin/pools");
        router.refresh();
        return;
      }

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

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={onSubmit}>
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
        {loadError ? (
          <p className={formErrorClassName} role="alert">
            {loadError}
          </p>
        ) : null}
        {!loadError && tournaments.length === 0 ? (
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
        <label className={formLabelClassName} htmlFor={deadlineId}>
          Bracket deadline
        </label>
        <input
          className={formInputClassName}
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
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create Pool"
              : "Save Pool"}
        </button>
      </div>
    </form>
  );
}
