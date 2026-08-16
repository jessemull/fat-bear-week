"use client";

import { useEffect, useId, useRef } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import {
  formButtonDangerClassName,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface ConfirmDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  pending?: boolean;
  title: string;
  tone?: "danger" | "default";
}

export function ConfirmDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  onCancel,
  onConfirm,
  open,
  pending = false,
  title,
  tone = "default",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, open, pending]);

  if (!open) {
    return null;
  }

  const confirmClassName =
    tone === "danger" ? formButtonDangerClassName : formButtonPrimaryClassName;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Dismiss confirmation"
        className="absolute inset-0 cursor-pointer bg-zinc-950/60"
        disabled={pending}
        type="button"
        onClick={onCancel}
      />
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-md border border-zinc-300 bg-white p-5 shadow-xl dark:border-zinc-600 dark:bg-zinc-950"
        role="dialog"
      >
        <div className="flex flex-col gap-2">
          <h2 className={`text-lg ${formHeadingClassName}`} id={titleId}>
            {title}
          </h2>
          <p className={`text-sm ${formMutedClassName}`} id={descriptionId}>
            {description}
          </p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className={`${formButtonSecondaryClassName} w-full justify-center`}
            disabled={pending}
            ref={cancelRef}
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`${confirmClassName} w-full justify-center`}
            disabled={pending}
            type="button"
            onClick={onConfirm}
          >
            {pending ? (
              <ButtonPendingLabel>Working…</ButtonPendingLabel>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
