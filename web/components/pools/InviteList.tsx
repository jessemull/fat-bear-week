"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formButtonSecondaryClassName,
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface InviteListItem {
  email: null | string;
  expiresAt: null | string;
  id: string;
  nameHint: null | string;
  status: "expired" | "unused" | "used";
}

interface InviteListProps {
  invites: InviteListItem[];
  poolId: string;
}

export function InviteList({ invites, poolId }: InviteListProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<null | string>(null);

  if (invites.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No invites yet.
      </p>
    );
  }

  async function resend(inviteId: string) {
    setPendingId(inviteId);

    try {
      await fetch(`/api/pools/${poolId}/invites/${inviteId}/resend`, {
        method: "POST",
      });
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <ul className="flex flex-col gap-3">
      {invites.map((invite) => (
        <li
          key={invite.id}
          className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700"
        >
          <div>
            <p className={formHeadingClassName}>
              {invite.email ?? "No email"}
              {invite.nameHint ? ` (${invite.nameHint})` : ""}
            </p>
            <p className={`text-sm ${formMutedClassName}`}>
              {invite.status}
              {invite.expiresAt
                ? ` · expires ${new Date(invite.expiresAt).toLocaleString()}`
                : ""}
            </p>
          </div>
          {invite.status === "unused" ? (
            <button
              className={formButtonSecondaryClassName}
              disabled={pendingId === invite.id}
              type="button"
              onClick={() => void resend(invite.id)}
            >
              {pendingId === invite.id ? "Sending…" : "Resend"}
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
