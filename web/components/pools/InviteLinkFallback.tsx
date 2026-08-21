"use client";

import { useState } from "react";

import {
  formButtonSecondaryClassName,
  formErrorClassName,
  formInputClassName,
} from "@/lib/form-styles";

interface InviteLinkFallbackProps {
  inviteUrl: string;
  message?: string;
}

export function InviteLinkFallback({
  inviteUrl,
  message = "Email could not be sent. Copy this invite link:",
}: InviteLinkFallbackProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<null | string>(null);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setCopyError(null);
    } catch {
      setCopied(false);
      setCopyError("Copy failed — select the link and copy it manually.");
    }
  }

  return (
    <div className="@container flex w-full flex-col gap-2" role="status">
      <p className="text-sm text-red-600/80 dark:text-red-600/80">{message}</p>
      <div className="flex flex-col gap-2 @min-[512px]:flex-row @min-[512px]:items-center">
        <input
          aria-label="Invite link"
          className={formInputClassName}
          readOnly
          value={inviteUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
        <button
          className={`${formButtonSecondaryClassName} w-full justify-center @min-[512px]:w-auto`}
          type="button"
          onClick={() => void onCopy()}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
      {copyError ? <p className={formErrorClassName}>{copyError}</p> : null}
    </div>
  );
}
