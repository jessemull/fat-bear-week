"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formActionsClassNames,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface CreateTournamentResponse {
  data?: {
    tournament?: {
      id: string;
    };
  };
  error?: string;
}

export function CreateTournamentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsedYear = Number(year);

    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      setError("Enter a year between 2000 and 2100.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/admin/tournaments", {
        body: JSON.stringify({ year: parsedYear }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as CreateTournamentResponse;

      if (!response.ok) {
        setError(json.error ?? "Unable to create tournament.");
        return;
      }

      const tournamentId = json.data?.tournament?.id;

      if (!tournamentId) {
        setError("Unable to create tournament.");
        return;
      }

      router.push(`/admin/tournaments/${tournamentId}`);
      router.refresh();
      toast("Tournament created.");
    } catch {
      setError("Unable to create tournament right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="tournament-year">
          Year
        </label>
        <input
          className={formInputClassName}
          id="tournament-year"
          inputMode="numeric"
          max={2100}
          min={2000}
          name="year"
          required
          type="number"
          value={year}
          onChange={(event) => setYear(event.target.value)}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <div className={formActionsClassNames.lg}>
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
          disabled={pending}
          type="submit"
        >
          {pending ? (
            <ButtonPendingLabel>Creating…</ButtonPendingLabel>
          ) : (
            "Create Tournament"
          )}
        </button>
      </div>
    </FormShell>
  );
}
