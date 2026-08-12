"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  formButtonSecondaryClassName,
  formErrorClassName,
  formMutedClassName,
} from "@/lib/form-styles";

export interface BearListItem {
  id: string;
  name: string;
  nickname: null | string;
  number: null | number;
}

interface BearListProps {
  bears: BearListItem[];
}

export function BearList({ bears }: BearListProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [pendingId, setPendingId] = useState<null | string>(null);

  if (bears.length === 0) {
    return (
      <p className={formMutedClassName} role="status">
        No bears yet.
      </p>
    );
  }

  async function onDelete(bearId: string) {
    setError(null);
    setPendingId(bearId);

    try {
      const response = await fetch(`/api/admin/bears/${bearId}`, {
        method: "DELETE",
      });
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to delete bear.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to delete bear right now.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {bears.map((bear) => (
          <li
            key={bear.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3 dark:border-zinc-700"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {bear.number !== null ? `#${bear.number} ` : ""}
                {bear.name}
              </p>
              {bear.nickname ? (
                <p className={`text-sm ${formMutedClassName}`}>
                  {bear.nickname}
                </p>
              ) : null}
            </div>
            <button
              className={formButtonSecondaryClassName}
              disabled={pendingId === bear.id}
              type="button"
              onClick={() => void onDelete(bear.id)}
            >
              {pendingId === bear.id ? "Deleting…" : "Delete"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
