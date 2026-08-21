"use client";

import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface ForgotPasswordFormProps {
  onBotCheckReset?: () => void;
  onSubmitted?: () => void;
  turnstileToken: null | string;
}

export function ForgotPasswordForm({
  onBotCheckReset,
  onSubmitted,
  turnstileToken,
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError("Complete the bot check before continuing.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        body: JSON.stringify({ email, turnstileToken }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to send a reset email.");
        onBotCheckReset?.();
        return;
      }

      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError("Unable to send a reset email right now.");
      onBotCheckReset?.();
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-zinc-700 dark:text-zinc-300" role="status">
        If that email is on an account, we sent a reset link.
      </p>
    );
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="forgot-password-email">
          Email
        </label>
        <input
          autoComplete="email"
          className={formInputClassName}
          id="forgot-password-email"
          name="email"
          placeholder="Enter your email..."
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          <ButtonPendingLabel>Sending…</ButtonPendingLabel>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}
