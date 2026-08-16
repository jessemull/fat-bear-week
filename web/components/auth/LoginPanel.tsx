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

export function LoginPanel() {
  const [turnstileToken, setTurnstileToken] = useState<null | string>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Sign In</h1>
        <p className={`text-sm ${formMutedClassName}`}>
          There is no public registration. Please join with your personal invite
          link.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <SignInForm turnstileToken={turnstileToken} />
        <p className={`text-center text-sm ${formMutedClassName}`}>
          <Link className={formLinkClassName} href="/">
            Back home
          </Link>
        </p>
        <div className="mt-1 flex justify-center">
          <TurnstileWidget onToken={setTurnstileToken} />
        </div>
      </div>
    </div>
  );
}
