"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  formButtonDangerClassName,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onConfirmDelete() {
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete tournament.");
        setConfirmOpen(false);
        return;
      }

      setConfirmOpen(false);
      router.push("/admin/tournaments");
      router.refresh();
    } catch {
      setError("Unable to delete tournament right now.");
      setConfirmOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-fit flex-col items-start gap-3">
      <button
        className={formButtonDangerClassName}
        disabled={pending}
        type="button"
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? (
          <ButtonPendingLabel>Deleting…</ButtonPendingLabel>
        ) : (
          "Delete Tournament"
        )}
      </button>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel="Delete Tournament"
        description={`Delete tournament ${year}? This cannot be undone. Pools must be removed first.`}
        open={confirmOpen}
        pending={pending}
        title="Delete tournament"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
