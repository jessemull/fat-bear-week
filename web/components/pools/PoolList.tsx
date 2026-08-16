"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent } from "react";

import { formMutedClassName } from "@/lib/form-styles";

export interface PoolListItem {
  entryCount: number;
  id: string;
  maxPlayers: number;
  name: string;
  role: "commissioner" | "member";
}

interface PoolListProps {
  pools: PoolListItem[];
}

export function PoolList({ pools }: PoolListProps) {
  const router = useRouter();

  if (pools.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No pools yet. Create one for this year&apos;s tournament.
      </p>
    );
  }

  function openPool(pool: PoolListItem) {
    if (pool.role !== "commissioner") {
      return;
    }

    router.push(`/admin/pools/${pool.id}`);
  }

  function onRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    pool: PoolListItem,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPool(pool);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-300 dark:border-zinc-600">
            <th className={`py-2 pl-3 pr-4 font-medium ${formMutedClassName}`}>
              Name
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Players
            </th>
            <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
              Role
            </th>
            <th className="w-10 py-2 pr-3">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pools.map((pool) => {
            const canOpen = pool.role === "commissioner";

            return (
              <tr
                key={pool.id}
                aria-label={canOpen ? `Open ${pool.name}` : undefined}
                className={
                  canOpen
                    ? "group cursor-pointer border-b border-zinc-200 transition-colors hover:bg-amber-50/80 focus-visible:bg-amber-50/80 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
                    : "border-b border-zinc-200 dark:border-zinc-700"
                }
                role={canOpen ? "link" : undefined}
                tabIndex={canOpen ? 0 : undefined}
                onClick={canOpen ? () => openPool(pool) : undefined}
                onKeyDown={
                  canOpen ? (event) => onRowKeyDown(event, pool) : undefined
                }
              >
                <td className="py-3 pl-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                  {pool.name}
                </td>
                <td className="py-3 pr-4 text-zinc-700 dark:text-zinc-300">
                  {pool.entryCount}/{pool.maxPlayers}
                </td>
                <td className="py-3 pr-4 capitalize text-zinc-700 dark:text-zinc-300">
                  {pool.role}
                </td>
                <td className="py-3 pr-3">
                  {canOpen ? (
                    <span className="flex justify-end">
                      <ExternalLink
                        aria-hidden="true"
                        className="size-4 text-amber-800 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:text-amber-400"
                        strokeWidth={1.75}
                      />
                    </span>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
