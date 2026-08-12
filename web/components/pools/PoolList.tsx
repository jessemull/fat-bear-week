import Link from "next/link";

import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
} from "@/lib/form-styles";

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
  if (pools.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No pools yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {pools.map((pool) => (
        <li
          key={pool.id}
          className="flex flex-col gap-1 border-b border-zinc-200 pb-3 dark:border-zinc-700"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={formHeadingClassName}>{pool.name}</p>
            <p className={`text-sm ${formMutedClassName}`}>
              {pool.entryCount}/{pool.maxPlayers} players · {pool.role}
            </p>
          </div>
          {pool.role === "commissioner" ? (
            <Link
              className={`text-sm ${formLinkClassName}`}
              href={`/pools/${pool.id}/invites`}
            >
              Manage invites
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
