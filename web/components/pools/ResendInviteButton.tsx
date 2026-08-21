"use client";

import { InviteLinkFallback } from "@/components/pools/InviteLinkFallback";
import {
  ResendInviteHeaderAction,
  useResendInvite,
} from "@/components/pools/useResendInvite";

interface ResendInviteButtonProps {
  inviteId: string;
  poolId: string;
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
