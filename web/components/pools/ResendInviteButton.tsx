"use client";

import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { useToast } from "@/components/Toast";
import { formButtonPrimaryClassName } from "@/lib/form-styles";

interface ResendInviteButtonProps {
  inviteId: string;
  poolId: string;
}

export function ResendInviteButton({
  inviteId,
  poolId,
}: ResendInviteButtonProps) {
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function onResend() {
    setPending(true);

    try {
      const response = await fetch(
        `/api/pools/${poolId}/invites/${inviteId}/resend`,
        {
          method: "POST",
        },
      );
      const json = (await response.json()) as {
        data?: { emailSent: boolean };
        error?: string;
      };

      if (!response.ok) {
        toast(json.error ?? "Unable to resend invite.", "error");
        return;
      }

      if (json.data && !json.data.emailSent) {
        toast("Invite ready, but email could not be sent.", "error");
        return;
      }

      toast("Invite resent.");
    } catch {
      toast("Unable to resend invite right now.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className={formButtonPrimaryClassName}
      disabled={pending}
      type="button"
      onClick={() => void onResend()}
    >
      {pending ? (
        <ButtonPendingLabel>Sending…</ButtonPendingLabel>
      ) : (
        "Resend Invite"
      )}
    </button>
  );
}
