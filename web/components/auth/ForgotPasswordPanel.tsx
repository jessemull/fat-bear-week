"use client";

import Link from "next/link";
import { useState } from "react";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";

export function ForgotPasswordPanel() {
  const [resetNonce, setResetNonce] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  function onBotCheckReset() {
    setTurnstileToken(null);
    setResetNonce((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Forgot password</h1>
        <p className={`text-sm ${formMutedClassName}`}>
          Enter the email on your invite. We will send a reset link if it
          matches an account.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <ForgotPasswordForm
          turnstileToken={turnstileToken}
          onBotCheckReset={onBotCheckReset}
          onSubmitted={() => setSubmitted(true)}
        />
        <p className={`text-center text-sm ${formMutedClassName}`}>
          <Link className={formLinkClassName} href="/login">
            Back to sign in
          </Link>
        </p>
        {submitted ? null : (
          <div className="mt-1 flex justify-center">
            <TurnstileWidget
              resetNonce={resetNonce}
              onToken={setTurnstileToken}
            />
          </div>
        )}
      </div>
    </div>
  );
}
