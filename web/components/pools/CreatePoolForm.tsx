"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface TournamentOption {
  id: string;
  status: string;
  year: number;
}

export function CreatePoolForm() {
  const router = useRouter();
  const [bracketDeadline, setBracketDeadline] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [maxPlayers, setMaxPlayers] = useState(100);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [tournamentId, setTournamentId] = useState("");
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
    setPending(true);

    try {
      const response = await fetch("/api/pools", {
        body: JSON.stringify({
          bracketDeadline: bracketDeadline
            ? new Date(bracketDeadline).toISOString()
            : null,
          maxPlayers,
          name,
          tournamentId,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { data?: unknown; error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to create pool.");
        return;
      }

      setName("");
      setBracketDeadline("");
      router.refresh();
    } catch {
      setError("Unable to create pool right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="pool-name">
          Pool name
        </label>
        <input
          className={formInputClassName}
          id="pool-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="pool-tournament-id">
          Tournament
        </label>
        <select
          className={formInputClassName}
          id="pool-tournament-id"
          name="tournamentId"
          required
          value={tournamentId}
          onChange={(event) => setTournamentId(event.target.value)}
        >
          {tournaments.length === 0 ? (
            <option value="">No tournaments available</option>
          ) : (
            tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.year} ({tournament.status})
              </option>
            ))
          )}
        </select>
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
        <label className={formLabelClassName} htmlFor="pool-max-players">
          Max players
        </label>
        <input
          className={formInputClassName}
          id="pool-max-players"
          max={500}
          min={1}
          name="maxPlayers"
          required
          type="number"
          value={maxPlayers}
          onChange={(event) => setMaxPlayers(Number(event.target.value))}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="pool-deadline">
          Bracket deadline (optional)
        </label>
        <input
          className={formInputClassName}
          id="pool-deadline"
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
      <button
        className={formButtonPrimaryClassName}
        disabled={pending || !tournamentId}
        type="submit"
      >
        {pending ? "Creating…" : "Create pool"}
      </button>
    </form>
  );
}
