"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { AccountInitials } from "@/components/account/AccountInitials";
import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formHeadingClassName,
  formInputClassName,
  formLabelClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface AccountProfileFormProps {
  email: null | string;
  name: string;
}

export function AccountProfileForm({ email, name }: AccountProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState(name);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (displayName.includes("@")) {
      setError("Display names cannot include @.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/account", {
        body: JSON.stringify({ name: displayName }),
        headers: { "content-type": "application/json" },
        method: "PATCH",
      });
      const json = (await response.json()) as {
        data?: { name?: string };
        error?: string;
      };

      if (!response.ok) {
        setError(json.error ?? "Unable to update name.");
        return;
      }

      if (json.data?.name) {
        setDisplayName(json.data.name);
      }

      toast("Display name saved.");
      router.refresh();
    } catch {
      setError("Unable to update name right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <div className="flex items-center gap-3">
        <AccountInitials name={displayName} size="md" />
        <h2 className={`text-xl ${formHeadingClassName}`}>Profile</h2>
      </div>
      <div className="flex flex-col gap-2">
        <p className={formLabelClassName}>Email</p>
        <p className="text-sm text-zinc-900 dark:text-zinc-50">
          {email ?? "None on file"}
        </p>
        <p className={`text-[13px] ${formMutedClassName}`}>
          {email
            ? "This address came from your invite and cannot be changed."
            : "Ask your commissioner for an invite with your address. Password reset by email is unavailable without one."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="account-name">
          Display name
        </label>
        <input
          autoComplete="username"
          className={formInputClassName}
          id="account-name"
          name="name"
          placeholder="Enter a display name..."
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        aria-busy={pending}
        className={formButtonPrimaryClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <ButtonPendingLabel>Saving…</ButtonPendingLabel>
        ) : (
          "Save"
        )}
      </button>
    </FormShell>
  );
}
