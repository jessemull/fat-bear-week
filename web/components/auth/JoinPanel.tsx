"use client";

import { useState } from "react";

import { JoinForm } from "@/components/auth/JoinForm";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface JoinPanelProps {
  email: null | string;
  existingAccount?: boolean;
  existingName?: null | string;
  nameHint?: null | string;
  poolName: string;
  token: string;
}

export function JoinPanel({
  email,
  existingAccount = false,
  existingName = null,
  nameHint = null,
  poolName,
  token,
}: JoinPanelProps) {
  const [resetNonce, setResetNonce] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  function onBotCheckReset() {
    setTurnstileToken(null);
    setResetNonce((value) => value + 1);
  }

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Join {poolName}</h1>
        <p className={`text-sm ${formMutedClassName}`}>
          {existingAccount
            ? "Invite-only pool. Enter your existing password to join with this account."
            : "Invite-only pool. Confirm your info and create a password."}
        </p>
      </div>
      <JoinForm
        email={email}
        existingAccount={existingAccount}
        existingName={existingName}
        nameHint={nameHint}
        token={token}
        turnstileToken={turnstileToken}
        onBotCheckReset={onBotCheckReset}
      />
      <div className="flex justify-center">
        <TurnstileWidget
          resetNonce={resetNonce}
          onToken={setTurnstileToken}
        />
      </div>
    </>
  );
}
