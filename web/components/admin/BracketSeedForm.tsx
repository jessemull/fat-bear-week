"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formLabelClassName,
  formMutedClassName,
} from "@/lib/form-styles";

export interface BracketSeedBear {
  id: string;
  name: string;
  number: null | number;
}

interface BracketSeedFormProps {
  bears: BracketSeedBear[];
  tournamentId: string;
}

function bearLabel(bear: BracketSeedBear): string {
  if (bear.number !== null) {
    return `#${bear.number} ${bear.name}`;
  }

  return bear.name;
}

export function BracketSeedForm({ bears, tournamentId }: BracketSeedFormProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  function toggleBear(bearId: string) {
    setOrderedIds((current) => {
      if (current.includes(bearId)) {
        return current.filter((id) => id !== bearId);
      }

      return [...current, bearId];
    });
  }

  function move(bearId: string, direction: -1 | 1) {
    setOrderedIds((current) => {
      const index = current.indexOf(bearId);

      if (index < 0) {
        return current;
      }

      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [item] = next.splice(index, 1);

      next.splice(nextIndex, 0, item);

      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/bracket`,
        {
          body: JSON.stringify({ bearIdsInOrder: orderedIds }),
          headers: { "content-type": "application/json" },
          method: "PUT",
        },
      );
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to seed bracket.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to seed bracket right now.");
    } finally {
      setPending(false);
    }
  }

  if (bears.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        Add bears before seeding the bracket.
      </p>
    );
  }

  const selected = orderedIds
    .map((id) => bears.find((bear) => bear.id === id))
    .filter((bear): bear is BracketSeedBear => Boolean(bear));

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit}>
      <fieldset className="flex flex-col gap-3">
        <legend className={formLabelClassName}>Select bears in seed order</legend>
        <ul className="flex flex-col gap-2">
          {bears.map((bear) => {
            const checked = orderedIds.includes(bear.id);
            const orderIndex = orderedIds.indexOf(bear.id);

            return (
              <li key={bear.id} className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                  <input
                    checked={checked}
                    type="checkbox"
                    onChange={() => toggleBear(bear.id)}
                  />
                  {bearLabel(bear)}
                  {checked ? (
                    <span className={`text-sm ${formMutedClassName}`}>
                      #{orderIndex + 1}
                    </span>
                  ) : null}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      {selected.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className={formLabelClassName}>Seed order</p>
          <ol className="flex flex-col gap-2">
            {selected.map((bear, index) => (
              <li
                key={bear.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span className="text-zinc-900 dark:text-zinc-50">
                  {index + 1}. {bearLabel(bear)}
                </span>
                <span className="flex gap-2">
                  <button
                    className={formButtonSecondaryClassName}
                    disabled={index === 0}
                    type="button"
                    onClick={() => move(bear.id, -1)}
                  >
                    Up
                  </button>
                  <button
                    className={formButtonSecondaryClassName}
                    disabled={index === selected.length - 1}
                    type="button"
                    onClick={() => move(bear.id, 1)}
                  >
                    Down
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={formButtonPrimaryClassName}
        disabled={pending || orderedIds.length < 2}
        type="submit"
      >
        {pending ? "Seeding…" : "Seed bracket"}
      </button>
    </form>
  );
}
