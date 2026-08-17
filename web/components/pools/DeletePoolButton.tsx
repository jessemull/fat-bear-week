"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  formButtonDangerClassName,
  formErrorClassName,
} from "@/lib/form-styles";

interface DeletePoolButtonProps {
  name: string;
  poolId: string;
}

export function DeletePoolButton({ name, poolId }: DeletePoolButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onConfirmDelete() {
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/pools/${poolId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete pool.");
        setConfirmOpen(false);
        return;
      }

      setConfirmOpen(false);
      router.push("/admin/pools");
      router.refresh();
    } catch {
      setError("Unable to delete pool right now.");
      setConfirmOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-fit flex-col gap-3">
      <button
        className={formButtonDangerClassName}
        disabled={pending}
        type="button"
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? (
          <ButtonPendingLabel>Deleting…</ButtonPendingLabel>
        ) : (
          "Delete Pool"
        )}
      </button>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <ConfirmDialog
        confirmLabel="Delete Pool"
        description={`Delete pool ${name}? Invites and player entries for this pool will be removed. This cannot be undone.`}
        open={confirmOpen}
        pending={pending}
        title="Delete pool"
        tone="danger"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void onConfirmDelete()}
      />
    </div>
  );
}
