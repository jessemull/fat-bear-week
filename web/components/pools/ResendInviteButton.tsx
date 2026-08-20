"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import {
  AdminPageHeader,
  AdminPageHeaderButtonAction,
} from "@/components/admin/AdminPageHeader";
import { InviteLinkFallback } from "@/components/pools/InviteLinkFallback";
import { useToast } from "@/components/Toast";

interface InviteEditHeaderProps {
  description: string;
  inviteId: string;
  poolId: string;
  showResend: boolean;
  title: string;
}

interface ResendInviteButtonProps {
  inviteId: string;
  poolId: string;
}

interface ResendInviteState {
  inviteUrl: null | string;
  onResend: () => Promise<void>;
  pending: boolean;
}

function useResendInvite({
  inviteId,
  poolId,
}: ResendInviteButtonProps): ResendInviteState {
  const { toast } = useToast();
  const [inviteUrl, setInviteUrl] = useState<null | string>(null);
  const [pending, setPending] = useState(false);

  async function onResend() {
    setPending(true);
    setInviteUrl(null);

    try {
      const response = await fetch(
        `/api/pools/${poolId}/invites/${inviteId}/resend`,
        {
          method: "POST",
        },
      );
      const json = (await response.json()) as {
        data?: { emailSent: boolean; inviteUrl?: string };
        error?: string;
      };

      if (!response.ok) {
        toast(json.error ?? "Unable to resend invite.", "error");
        return;
      }

      if (json.data && !json.data.emailSent) {
        if (json.data.inviteUrl) {
          setInviteUrl(json.data.inviteUrl);
        }

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

  return {
    inviteUrl,
    onResend,
    pending,
  };
}

function ResendInviteHeaderAction({
  onResend,
  pending,
}: Pick<ResendInviteState, "onResend" | "pending">) {
  return (
    <AdminPageHeaderButtonAction
      disabled={pending}
      icon={RefreshCw}
      label={pending ? "Sending…" : "Resend Invite"}
      onClick={() => {
        void onResend();
      }}
    />
  );
}

export function InviteEditHeader({
  description,
  inviteId,
  poolId,
  showResend,
  title,
}: InviteEditHeaderProps) {
  const { inviteUrl, onResend, pending } = useResendInvite({
    inviteId,
    poolId,
  });

  return (
    <>
      <AdminPageHeader
        action={
          showResend ? (
            <ResendInviteHeaderAction
              pending={pending}
              onResend={onResend}
            />
          ) : undefined
        }
        description={description}
        title={title}
      />
      {inviteUrl ? <InviteLinkFallback inviteUrl={inviteUrl} /> : null}
    </>
  );
}

export function ResendInviteButton({
  inviteId,
  poolId,
}: ResendInviteButtonProps) {
  const { inviteUrl, onResend, pending } = useResendInvite({
    inviteId,
    poolId,
  });

  return (
    <>
      <ResendInviteHeaderAction pending={pending} onResend={onResend} />
      {inviteUrl ? <InviteLinkFallback inviteUrl={inviteUrl} /> : null}
    </>
  );
}
