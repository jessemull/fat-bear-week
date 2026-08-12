"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface SignInFormProps {
  turnstileToken: null | string;
}

export function SignInForm({ turnstileToken }: SignInFormProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [pending, setPending] = useState(false);

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
        body: JSON.stringify({ identifier, password, turnstileToken }),
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
        <label className={formLabelClassName} htmlFor="sign-in-identifier">
          Display Name / Email
        </label>
        <input
          autoComplete="username"
          className={formInputClassName}
          id="sign-in-identifier"
          name="identifier"
          placeholder="Enter a name or email..."
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="sign-in-password">
          Password
        </label>
        <div className="relative">
          <input
            autoComplete="current-password"
            className={`${formInputClassName} w-full pr-11`}
            id="sign-in-password"
            minLength={8}
            name="password"
            placeholder="Enter a password..."
            required
            type={passwordVisible ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            type="button"
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" className="size-4" strokeWidth={2} />
            ) : (
              <Eye aria-hidden="true" className="size-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={`${formButtonPrimaryClassName} mt-2`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
