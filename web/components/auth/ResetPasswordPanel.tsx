"use client";

import { useState } from "react";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface ResetPasswordPanelProps {
  token: string;
}

export function ResetPasswordPanel({ token }: ResetPasswordPanelProps) {
  const [resetNonce, setResetNonce] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  function onBotCheckReset() {
    setTurnstileToken(null);
    setResetNonce((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Reset password</h1>
        <p className={`text-sm ${formMutedClassName}`}>
          Choose a new password for your account.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <ResetPasswordForm
          token={token}
          turnstileToken={turnstileToken}
          onBotCheckReset={onBotCheckReset}
        />
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
