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
  formMutedClassName,
} from "@/lib/form-styles";

interface JoinFormProps {
  email: null | string;
  existingAccount?: boolean;
  existingName?: null | string;
  nameHint?: null | string;
  onBotCheckReset?: () => void;
  token: string;
  turnstileToken: null | string;
}

export function JoinForm({
  email,
  existingAccount = false,
  existingName = null,
  nameHint = null,
  onBotCheckReset,
  token,
  turnstileToken,
}: JoinFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [error, setError] = useState<null | string>(null);
  const [name, setName] = useState(existingName ?? nameHint ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!existingAccount && password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    if (!turnstileToken) {
      setError("Complete the bot check before joining.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/join", {
        body: JSON.stringify({
          name: existingAccount ? (existingName ?? name) : name,
          password,
          passwordConfirm: existingAccount ? password : passwordConfirm,
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
        setError(json.error ?? "Unable to join.");
        onBotCheckReset?.();
        return;
      }

      if (json.data?.needsSignIn) {
        toast("Account ready — sign in to continue.");
        router.push("/login?joined=1");
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to join right now.");
      onBotCheckReset?.();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
      {email ? (
        <div className="flex flex-col gap-2">
          <label className={formLabelClassName} htmlFor="join-email">
            Email
          </label>
          <input
            className={formInputClassName}
            id="join-email"
            name="email"
            readOnly
            type="email"
            value={email}
          />
          <p className={`text-sm ${formMutedClassName}`}>
            This invite is locked to this address.
          </p>
        </div>
      ) : null}
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="join-name">
          Display name
        </label>
        <input
          autoComplete="username"
          className={formInputClassName}
          id="join-name"
          name="name"
          placeholder="Enter a display name..."
          readOnly={existingAccount}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {existingAccount ? (
          <p className={`text-sm ${formMutedClassName}`}>
            Your existing display name will be used for this pool.
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="join-password">
          Password
        </label>
        <input
          autoComplete={existingAccount ? "current-password" : "new-password"}
          className={formInputClassName}
          id="join-password"
          minLength={8}
          name="password"
          placeholder={
            existingAccount
              ? "Enter your existing password..."
              : "Enter a password..."
          }
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {existingAccount ? null : (
        <div className="flex flex-col gap-2">
          <label className={formLabelClassName} htmlFor="join-password-confirm">
            Confirm password
          </label>
          <input
            autoComplete="new-password"
            className={formInputClassName}
            id="join-password-confirm"
            minLength={8}
            name="passwordConfirm"
            placeholder="Confirm your password..."
            required
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
          />
        </div>
      )}
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
          <ButtonPendingLabel>Joining…</ButtonPendingLabel>
        ) : (
          "Join pool"
        )}
      </button>
    </form>
  );
}
