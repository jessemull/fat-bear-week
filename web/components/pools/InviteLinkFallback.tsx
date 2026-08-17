"use client";

import { useState } from "react";

import { formButtonSecondaryClassName, formInputClassName } from "@/lib/form-styles";

interface InviteLinkFallbackProps {
  inviteUrl: string;
  message?: string;
}

export function InviteLinkFallback({
  inviteUrl,
  message = "Email could not be sent. Copy this invite link:",
}: InviteLinkFallbackProps) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-2" role="status">
      <p className="text-sm text-red-600/80 dark:text-red-600/80">{message}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          aria-label="Invite link"
          className={formInputClassName}
          readOnly
          value={inviteUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          className={`${formButtonSecondaryClassName} w-full justify-center sm:w-auto`}
          type="button"
          onClick={() => void onCopy()}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
