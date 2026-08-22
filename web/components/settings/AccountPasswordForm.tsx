"use client";

import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formHeadingClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

export function AccountPasswordForm() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/account/password", {
        body: JSON.stringify({
          currentPassword,
          password,
          passwordConfirm,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to change password.");
        return;
      }

      setCurrentPassword("");
      setPassword("");
      setPasswordConfirm("");
      toast("Password updated.");
    } catch {
      setError("Unable to change password right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <h2 className={`text-xl ${formHeadingClassName}`}>Password</h2>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="account-current-password">
          Current password
        </label>
        <input
          autoComplete="current-password"
          className={formInputClassName}
          id="account-current-password"
          minLength={8}
          name="currentPassword"
          placeholder="Enter your current password..."
          required
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="account-new-password">
          New password
        </label>
        <input
          autoComplete="new-password"
          className={formInputClassName}
          id="account-new-password"
          minLength={8}
          name="password"
          placeholder="Enter a new password..."
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          className={formLabelClassName}
          htmlFor="account-password-confirm"
        >
          Confirm new password
        </label>
        <input
          autoComplete="new-password"
          className={formInputClassName}
          id="account-password-confirm"
          minLength={8}
          name="passwordConfirm"
          placeholder="Confirm your new password..."
          required
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
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
          <ButtonPendingLabel>Updating…</ButtonPendingLabel>
        ) : (
          "Change Password"
        )}
      </button>
    </FormShell>
  );
}
