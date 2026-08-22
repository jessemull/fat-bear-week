"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { useToast } from "@/components/Toast";
import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface ResetPasswordFormProps {
  onBotCheckReset?: () => void;
  token: string;
  turnstileToken: null | string;
}

export function ResetPasswordForm({
  onBotCheckReset,
  token,
  turnstileToken,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const { toastAfterNavigation } = useToast();
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

    if (!turnstileToken) {
      setError("Complete the bot check before continuing.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        body: JSON.stringify({
          password,
          passwordConfirm,
          token,
          turnstileToken,
        }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as {
        data?: { needsSignIn?: boolean };
        error?: string;
      };

      if (!response.ok) {
        setError(json.error ?? "Unable to reset password.");
        onBotCheckReset?.();
        return;
      }

      if (json.data?.needsSignIn) {
        toastAfterNavigation("Password updated — sign in to continue.");
        router.push("/login");
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to reset password right now.");
      onBotCheckReset?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="reset-password">
          New password
        </label>
        <input
          autoComplete="new-password"
          className={formInputClassName}
          id="reset-password"
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
        <label className={formLabelClassName} htmlFor="reset-password-confirm">
          Confirm password
        </label>
        <input
          autoComplete="new-password"
          className={formInputClassName}
          id="reset-password-confirm"
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
        className={`${formButtonPrimaryClassName} mt-2`}
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <ButtonPendingLabel>Updating…</ButtonPendingLabel>
        ) : (
          "Reset password"
        )}
      </button>
    </form>
  );
}
