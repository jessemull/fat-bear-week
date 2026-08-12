"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

export function SignInForm() {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError("Complete the bot check before signing in.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/sign-in", {
        body: JSON.stringify({ name, password, turnstileToken }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as { data?: unknown; error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to sign in.");
        return;
      }

      router.push("/pools");
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mx-auto flex w-full max-w-md flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="sign-in-name">
          Display name
        </label>
        <input
          autoComplete="username"
          className={formInputClassName}
          id="sign-in-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="sign-in-password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className={formInputClassName}
          id="sign-in-password"
          minLength={8}
          name="password"
          required
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <TurnstileWidget onToken={setTurnstileToken} />
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={formButtonPrimaryClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
