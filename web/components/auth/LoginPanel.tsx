"use client";

import Link from "next/link";
import { useState } from "react";

import { SignInForm } from "@/components/auth/SignInForm";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface LoginPanelProps {
  joined?: boolean;
}

export function LoginPanel({ joined = false }: LoginPanelProps) {
  const [resetNonce, setResetNonce] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  function onBotCheckReset() {
    setTurnstileToken(null);
    setResetNonce((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Sign In</h1>
        {joined ? (
          <p className={`text-sm ${formMutedClassName}`} role="status">
            Your account is ready. Sign in to continue.
          </p>
        ) : (
          <p className={`text-sm ${formMutedClassName}`}>
            There is no public registration. Please join with your personal
            invite link.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <SignInForm
          turnstileToken={turnstileToken}
          onBotCheckReset={onBotCheckReset}
        />
        <p className={`text-center text-sm ${formMutedClassName}`}>
          <Link className={formLinkClassName} href="/">
            Back home
          </Link>
        </p>
        <div className="mt-1 flex justify-center">
          <TurnstileWidget
            resetNonce={resetNonce}
            onToken={setTurnstileToken}
          />
        </div>
      </div>
    </div>
  );
}
