"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface SetWinnerFormProps {
  bearAId: null | string;
  bearALabel: string;
  bearBId: null | string;
  bearBLabel: string;
  matchupId: string;
}

export function SetWinnerForm({
  bearAId,
  bearALabel,
  bearBId,
  bearBLabel,
  matchupId,
}: SetWinnerFormProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [officialVotesA, setOfficialVotesA] = useState("");
  const [officialVotesB, setOfficialVotesB] = useState("");
  const [pending, setPending] = useState(false);
  const [winnerId, setWinnerId] = useState(bearAId ?? bearBId ?? "");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const body: {
        officialVotesA?: number;
        officialVotesB?: number;
        winnerId: string;
      } = { winnerId };

      if (officialVotesA.trim()) {
        body.officialVotesA = Number(officialVotesA);
      }

      if (officialVotesB.trim()) {
        body.officialVotesB = Number(officialVotesB);
      }

      const response = await fetch(`/api/admin/matchups/${matchupId}/result`, {
        body: JSON.stringify(body),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to set winner.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to set winner right now.");
    } finally {
      setPending(false);
    }
  }

  if (!bearAId && !bearBId) {
    return (
      <p className={formMutedClassName} role="status">
        Waiting for both sides.
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={onSubmit}>
      <fieldset className="flex flex-col gap-2">
        <legend className={formLabelClassName}>Winner</legend>
        {bearAId ? (
          <label className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <input
              checked={winnerId === bearAId}
              name={`winner-${matchupId}`}
              type="radio"
              value={bearAId}
              onChange={() => setWinnerId(bearAId)}
            />
            {bearALabel}
          </label>
        ) : null}
        {bearBId ? (
          <label className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
            <input
              checked={winnerId === bearBId}
              name={`winner-${matchupId}`}
              type="radio"
              value={bearBId}
              onChange={() => setWinnerId(bearBId)}
            />
            {bearBLabel}
          </label>
        ) : null}
      </fieldset>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label
            className={formLabelClassName}
            htmlFor={`votes-a-${matchupId}`}
          >
            Votes A
          </label>
          <input
            className={formInputClassName}
            id={`votes-a-${matchupId}`}
            min={0}
            name="officialVotesA"
            type="number"
            value={officialVotesA}
            onChange={(event) => setOfficialVotesA(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label
            className={formLabelClassName}
            htmlFor={`votes-b-${matchupId}`}
          >
            Votes B
          </label>
          <input
            className={formInputClassName}
            id={`votes-b-${matchupId}`}
            min={0}
            name="officialVotesB"
            type="number"
            value={officialVotesB}
            onChange={(event) => setOfficialVotesB(event.target.value)}
          />
        </div>
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={formButtonPrimaryClassName}
        disabled={pending || !winnerId}
        type="submit"
      >
        {pending ? "Saving…" : "Set winner"}
      </button>
    </form>
  );
}
