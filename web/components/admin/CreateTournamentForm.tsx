"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

export function CreateTournamentForm() {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/admin/tournaments", {
        body: JSON.stringify({ year }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { data?: unknown; error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to create tournament.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to create tournament right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="tournament-year">
          Year
        </label>
        <input
          className={formInputClassName}
          id="tournament-year"
          max={2100}
          min={2000}
          name="year"
          required
          type="number"
          value={year}
          onChange={(event) => setYear(Number(event.target.value))}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={formButtonPrimaryClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating…" : "Create tournament"}
      </button>
    </form>
  );
}
