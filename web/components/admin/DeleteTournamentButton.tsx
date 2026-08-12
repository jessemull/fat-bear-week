"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formButtonSecondaryClassName,
  formErrorClassName,
} from "@/lib/form-styles";

interface DeleteTournamentButtonProps {
  tournamentId: string;
  year: number;
}

export function DeleteTournamentButton({
  tournamentId,
  year,
}: DeleteTournamentButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete tournament ${year}? This cannot be undone. Pools must be removed first.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete tournament.");
        return;
      }

      router.push("/admin/tournaments");
      router.refresh();
    } catch {
      setError("Unable to delete tournament right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className={`${formButtonSecondaryClassName} border-red-300 text-red-800 dark:border-red-800 dark:text-red-300`}
        disabled={pending}
        type="button"
        onClick={() => void onDelete()}
      >
        {pending ? "Deleting…" : "Delete tournament"}
      </button>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
