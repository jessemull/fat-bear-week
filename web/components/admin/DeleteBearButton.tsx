"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormStandaloneAction } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formButtonDangerClassName,
  formErrorClassName,
  formStandaloneActionButtonClassNames,
} from "@/lib/form-styles";

interface DeleteBearButtonProps {
  bearId: string;
  bearName: string;
  tournamentId: string;
}

export function DeleteBearButton({
  bearId,
  bearName,
  tournamentId,
}: DeleteBearButtonProps) {
  const router = useRouter();
  const { toastAfterNavigation } = useToast();
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
      toastAfterNavigation("Bear deleted.");
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
    <FormStandaloneAction>
      <button
        className={`${formButtonDangerClassName} ${formStandaloneActionButtonClassNames.lg}`}
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
        description={`Delete bear ${bearName}? This cannot be undone. Bears used in matchups cannot be deleted.`}
        open={confirmOpen}
        pending={pending}
        title="Delete bear"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void onConfirmDelete()}
      />
    </FormStandaloneAction>
  );
}
