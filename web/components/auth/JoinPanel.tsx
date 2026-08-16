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
  nameHint?: null | string;
  poolName: string;
  token: string;
}

export function JoinPanel({
  email,
  nameHint = null,
  poolName,
  token,
}: JoinPanelProps) {
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  return (
    <>
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Join {poolName}</h1>
        <p className={`text-sm ${formMutedClassName}`}>
          Invite-only pool. Confirm your info and create a password.
        </p>
      </div>
      <JoinForm
        email={email}
        nameHint={nameHint}
        token={token}
        turnstileToken={turnstileToken}
      />
      <div className="flex justify-center">
        <TurnstileWidget onToken={setTurnstileToken} />
      </div>
    </>
  );
}
