"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface MintInviteFormProps {
  poolId: string;
}

export function MintInviteForm({ poolId }: MintInviteFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [inviteUrl, setInviteUrl] = useState<null | string>(null);
  const [nameHint, setNameHint] = useState("");
  const [pending, setPending] = useState(false);
  const [warning, setWarning] = useState<null | string>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setWarning(null);
    setInviteUrl(null);
    setPending(true);

    try {
      const response = await fetch(`/api/pools/${poolId}/invites`, {
        body: JSON.stringify({
          email,
          nameHint: nameHint.trim() ? nameHint.trim() : null,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as {
        data?: { emailSent: boolean; inviteUrl: string };
        error?: string;
      };

      if (!response.ok || !json.data) {
        setError(json.error ?? "Unable to mint invite.");
        return;
      }

      setInviteUrl(json.data.inviteUrl);

      if (!json.data.emailSent) {
        setWarning(
          "Invite created, but email could not be sent. Copy the link below.",
        );
      }

      setEmail("");
      setNameHint("");
      router.refresh();
    } catch {
      setError("Unable to mint invite right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-2">
          <label className={formLabelClassName} htmlFor="invite-email">
            Invitee email
          </label>
          <input
            className={formInputClassName}
            id="invite-email"
            name="email"
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className={formLabelClassName} htmlFor="invite-name-hint">
            Name hint (optional)
          </label>
          <input
            className={formInputClassName}
            id="invite-name-hint"
            name="nameHint"
            value={nameHint}
            onChange={(event) => setNameHint(event.target.value)}
          />
        </div>
        {error ? (
          <p className={formErrorClassName} role="alert">
            {error}
          </p>
        ) : null}
        {warning ? (
          <p className="text-sm text-amber-800 dark:text-amber-400" role="status">
            {warning}
          </p>
        ) : null}
        <button
          className={formButtonPrimaryClassName}
          disabled={pending}
          type="submit"
        >
          {pending ? "Sending…" : "Send invite"}
        </button>
      </form>
      {inviteUrl ? (
        <p className={`break-all text-sm ${formMutedClassName}`}>
          Invite link:{" "}
          <a className={formLinkClassName} href={inviteUrl}>
            {inviteUrl}
          </a>
        </p>
      ) : null}
    </div>
  );
}
