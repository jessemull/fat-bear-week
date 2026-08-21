"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formActionsClassName,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

export interface InviteFormValues {
  email: null | string;
  id: string;
  nameHint: null | string;
  status: "expired" | "unused" | "used";
}

interface InviteFormProps {
  invite: InviteFormValues;
  poolId: string;
}

export function InviteForm({ invite, poolId }: InviteFormProps) {
  const router = useRouter();
  const { toastAfterNavigation } = useToast();
  const [email, setEmail] = useState(invite.email ?? "");
  const [error, setError] = useState<null | string>(null);
  const [nameHint, setNameHint] = useState(invite.nameHint ?? "");
  const [pending, setPending] = useState(false);
  const readOnly = invite.status === "used";
  const statusLabel = `${invite.status.charAt(0).toUpperCase()}${invite.status.slice(1)}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (readOnly) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(
        `/api/pools/${poolId}/invites/${invite.id}`,
        {
          body: JSON.stringify({
            email: email.trim(),
            nameHint: nameHint.trim() ? nameHint.trim() : null,
          }),
          headers: { "content-type": "application/json" },
          method: "PATCH",
        },
      );
      const json = (await response.json()) as {
        data?: {
          invite?: InviteFormValues & { tokenRotated?: boolean };
        };
        error?: string;
      };

      if (!response.ok) {
        setError(json.error ?? "Unable to save invite.");
        return;
      }

      if (json.data?.invite?.tokenRotated) {
        toastAfterNavigation(
          "Invite saved. The old link is invalid — use Resend Invite for the new address.",
        );
      } else {
        toastAfterNavigation("Invite saved.");
      }

      router.push(`/admin/pools/${poolId}/invites`);
      router.refresh();
    } catch {
      setError("Unable to save invite right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="invite-email">
          Invitee email
        </label>
        <input
          className={formInputClassName}
          disabled={readOnly || pending}
          id="invite-email"
          name="email"
          placeholder="Enter an email..."
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex w-full flex-col gap-4 @min-[512px]:flex-row @min-[512px]:items-end">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className={formLabelClassName} htmlFor="invite-name-hint">
            Name Hint
          </label>
          <input
            className={formInputClassName}
            disabled={readOnly || pending}
            id="invite-name-hint"
            name="nameHint"
            placeholder="Optional display name..."
            value={nameHint}
            onChange={(event) => setNameHint(event.target.value)}
          />
        </div>
        <div className="flex w-full flex-col gap-2 @min-[512px]:w-28 @min-[512px]:shrink-0">
          <label className={formLabelClassName} htmlFor="invite-status">
            Status
          </label>
          <input
            className={`${formInputClassName} cursor-not-allowed`}
            disabled
            id="invite-status"
            name="status"
            readOnly
            type="text"
            value={statusLabel}
          />
        </div>
      </div>
      {readOnly ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Used invites cannot be edited.
        </p>
      ) : null}
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <div className={formActionsClassName}>
        <button
          className={`${formButtonSecondaryClassName} w-full justify-center`}
          disabled={pending}
          type="button"
          onClick={() => router.push(`/admin/pools/${poolId}/invites`)}
        >
          Cancel
        </button>
        <button
          className={`${formButtonPrimaryClassName} w-full justify-center`}
          disabled={readOnly || pending}
          type="submit"
        >
          {pending ? (
            <ButtonPendingLabel>Saving…</ButtonPendingLabel>
          ) : (
            "Save Invite"
          )}
        </button>
      </div>
    </FormShell>
  );
}
