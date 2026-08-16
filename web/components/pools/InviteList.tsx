"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent } from "react";

import { formMutedClassName } from "@/lib/form-styles";

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

function formatExpires(value: null | string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}

function formatStatus(status: InviteListItem["status"]): string {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

export function InviteList({ invites, poolId }: InviteListProps) {
  const router = useRouter();

  if (invites.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No invites yet.
      </p>
    );
  }

  function openInvite(inviteId: string) {
    router.push(`/admin/pools/${poolId}/invites/${inviteId}`);
  }

  function onRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    inviteId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openInvite(inviteId);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300 dark:border-zinc-600">
            <th className={`py-2 pl-3 pr-4 font-medium ${formMutedClassName}`}>
              Email
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Name Hint
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Status
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Expires
            </th>
            <th className="w-10 py-2 pr-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr
              key={invite.id}
              aria-label={`Open invite ${invite.email ?? invite.id}`}
              className="group cursor-pointer border-b border-zinc-200 transition-colors hover:bg-amber-50/80 focus-visible:bg-amber-50/80 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
              role="link"
              tabIndex={0}
              onClick={() => openInvite(invite.id)}
              onKeyDown={(event) => onRowKeyDown(event, invite.id)}
            >
              <td className="py-3 pl-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                {invite.email ?? "No email"}
              </td>
              <td className={`py-3 pr-4 ${formMutedClassName}`}>
                {invite.nameHint ?? "—"}
              </td>
              <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                {formatStatus(invite.status)}
              </td>
              <td className={`py-3 pr-4 ${formMutedClassName}`}>
                {formatExpires(invite.expiresAt)}
              </td>
              <td className="py-3 pr-3">
                <span className="flex justify-end">
                  <ExternalLink
                    aria-hidden="true"
                    className="size-4 text-amber-800 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-amber-400"
                    strokeWidth={1.75}
                  />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
