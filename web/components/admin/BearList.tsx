"use client";

import { ChevronRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { type KeyboardEvent } from "react";

import { Card, CardField, CardFields, CardList } from "@/components/Card";
import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

export interface BearListItem {
  id: string;
  name: string;
  nickname: null | string;
}

interface BearListProps {
  bears: BearListItem[];
  tournamentId: string;
}

export function BearList({ bears, tournamentId }: BearListProps) {
  const router = useRouter();

  if (bears.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No bears yet.
      </p>
    );
  }

  function openBear(bearId: string) {
    router.push(`/admin/tournaments/${tournamentId}/bears/${bearId}`);
  }

  function onRowKeyDown(
    event: KeyboardEvent<HTMLTableRowElement>,
    bearId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openBear(bearId);
    }
  }

  return (
    <>
      <CardList className="md:hidden">
        {bears.map((bear) => (
          <li key={bear.id}>
            <Card href={`/admin/tournaments/${tournamentId}/bears/${bear.id}`}>
              <div className="flex items-start justify-between gap-3">
                <h2 className={`text-lg ${formHeadingClassName}`}>{bear.name}</h2>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-amber-800 dark:text-amber-400"
                  strokeWidth={1.75}
                />
              </div>
              <CardFields>
                <CardField label="Nickname" value={bear.nickname ?? "—"} />
              </CardFields>
            </Card>
          </li>
        ))}
      </CardList>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-300 dark:border-zinc-600">
              <th className={`py-2 pl-3 pr-4 font-medium ${formMutedClassName}`}>
                Name
              </th>
              <th className={`py-2 pr-4 font-medium ${formMutedClassName}`}>
                Nickname
              </th>
              <th className="w-10 py-2 pr-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {bears.map((bear) => (
              <tr
                key={bear.id}
                aria-label={`Open bear ${bear.name}`}
                className="group cursor-pointer border-b border-zinc-200 transition-colors hover:bg-amber-50/80 focus-visible:bg-amber-50/80 dark:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:bg-zinc-900"
                role="link"
                tabIndex={0}
                onClick={() => openBear(bear.id)}
                onKeyDown={(event) => onRowKeyDown(event, bear.id)}
              >
                <td className="py-3 pl-3 pr-4 font-medium text-zinc-900 dark:text-zinc-50">
                  {bear.name}
                </td>
                <td className={`py-3 pr-4 ${formMutedClassName}`}>
                  {bear.nickname ?? "—"}
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
    </>
  );
}
