"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  formButtonDangerClassName,
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onConfirmDelete() {
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/admin/bears/${bearId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete bear.");
        setConfirmOpen(false);
        return;
      }

      setConfirmOpen(false);
      router.push(`/admin/tournaments/${tournamentId}/bears`);
      router.refresh();
    } catch {
      setError("Unable to delete bear right now.");
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
          "Delete Bear"
        )}
      </button>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel="Delete Bear"
        description={`Delete bear ${name}? This cannot be undone. Bears used in matchups cannot be deleted.`}
        open={confirmOpen}
        pending={pending}
        title="Delete bear"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
