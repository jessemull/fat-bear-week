"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formButtonSecondaryClassName,
  formErrorClassName,
} from "@/lib/form-styles";

interface DeleteBearButtonProps {
  bearId: string;
  name: string;
  tournamentId: string;
}

export function DeleteBearButton({
  bearId,
  name,
  tournamentId,
}: DeleteBearButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onDelete() {
    const confirmed = window.confirm(
      `Delete bear ${name}? This cannot be undone. Bears used in matchups cannot be deleted.`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/admin/bears/${bearId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete bear.");
        return;
      }

      router.push(`/admin/tournaments/${tournamentId}/bears`);
      router.refresh();
    } catch {
      setError("Unable to delete bear right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-fit flex-col gap-2">
      <button
        className={`${formButtonSecondaryClassName} border-red-300 text-red-800 dark:border-red-800 dark:text-red-300`}
        disabled={pending}
        type="button"
        onClick={() => void onDelete()}
      >
        {pending ? "Deleting…" : "Delete Bear"}
      </button>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
