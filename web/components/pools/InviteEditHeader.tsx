"use client";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { InviteLinkFallback } from "@/components/pools/InviteLinkFallback";
import {
  ResendInviteHeaderAction,
  useResendInvite,
} from "@/components/pools/useResendInvite";

interface InviteEditHeaderProps {
  description: string;
  inviteId: string;
  poolId: string;
  showResend: boolean;
  title: string;
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
            <ResendInviteHeaderAction pending={pending} onResend={onResend} />
          ) : undefined
        }
        description={description}
        title={title}
      />
      {inviteUrl ? <InviteLinkFallback inviteUrl={inviteUrl} /> : null}
    </>
  );
}
