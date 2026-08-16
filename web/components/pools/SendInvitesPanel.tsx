"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useRef, useState } from "react";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import {
  InviteCsvUploadDialog,
  type ParsedInviteRow,
} from "@/components/pools/InviteCsvUploadDialog";
import { useToast } from "@/components/Toast";
import {
  formButtonPrimaryClassName,
  formButtonPrimaryCompactClassName,
  formButtonSecondaryClassName,
  formButtonSecondaryCompactClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface InviteRow {
  email: string;
  id: string;
  nameHint: string;
}

interface SendInvitesPanelProps {
  poolId: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_ROW: InviteRow = { email: "", id: "row-0", nameHint: "" };

export function SendInvitesPanel({ poolId }: SendInvitesPanelProps) {
  const router = useRouter();
  const { toast } = useToast();
  const baseId = useId();
  const nextRowId = useRef(1);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState<InviteRow[]>([INITIAL_ROW]);
  const [uploadOpen, setUploadOpen] = useState(false);

  function createRow(email = "", nameHint = ""): InviteRow {
    const id = `row-${nextRowId.current}`;

    nextRowId.current += 1;

    return {
      email,
      id,
      nameHint,
    };
  }

  async function submitInvites(
    invites: { email: string; nameHint: null | string }[],
  ) {
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/pools/${poolId}/invites`, {
        body: JSON.stringify({ invites }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const json = (await response.json()) as {
        data?: {
          created: number;
          failed: number;
          results: {
            email: string;
            emailSent?: boolean;
            error?: string;
            inviteId?: string;
          }[];
        };
        error?: string;
      };

      if (!json.data) {
        setError(json.error ?? "Unable to send invites.");
        return;
      }

      const createFailures = json.data.results.filter(
        (result) => !result.inviteId,
      );
      const sendFailures = json.data.results.filter(
        (result) => result.inviteId && result.emailSent === false,
      );

      if (json.data.created === 0) {
        setError(
          createFailures
            .map((result) => result.error ?? result.email)
            .join(" "),
        );
        return;
      }

      if (createFailures.length > 0 || sendFailures.length > 0) {
        const parts = [`Sent ${json.data.created} invite(s).`];

        if (createFailures.length > 0) {
          parts.push(
            `Skipped ${createFailures.map((result) => result.email).join(", ")}.`,
          );
        }

        if (sendFailures.length > 0) {
          parts.push("Some emails could not be delivered.");
        }

        toast(parts.join(" "), "error");
        setRows(
          createFailures.length > 0
            ? createFailures.map((result) => {
                const existing = rows.find(
                  (row) =>
                    row.email.trim().toLowerCase() ===
                    result.email.toLowerCase(),
                );

                return createRow(result.email, existing?.nameHint ?? "");
              })
            : [createRow()],
        );
        router.refresh();
        return;
      }

      toast(
        json.data.created === 1
          ? "Invite sent."
          : `${json.data.created} invites sent.`,
      );
      router.push(`/admin/pools/${poolId}/invites`);
      router.refresh();
    } catch {
      setError("Unable to send invites right now.");
    } finally {
      setPending(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const invites = rows
      .map((row) => ({
        email: row.email.trim().toLowerCase(),
        nameHint: row.nameHint.trim() ? row.nameHint.trim() : null,
      }))
      .filter((row) => row.email.length > 0);
    const unique = new Map<string, (typeof invites)[number]>();

    for (const invite of invites) {
      if (!unique.has(invite.email)) {
        unique.set(invite.email, invite);
      }
    }

    const uniqueInvites = [...unique.values()];

    if (uniqueInvites.length === 0) {
      setError("Enter at least one email address.");
      return;
    }

    const invalid = uniqueInvites.find(
      (invite) => !EMAIL_PATTERN.test(invite.email),
    );

    if (invalid) {
      setError(`Invalid email address: ${invalid.email}`);
      return;
    }

    await submitInvites(uniqueInvites);
  }

  function updateRow(
    rowId: string,
    patch: Partial<Pick<InviteRow, "email" | "nameHint">>,
  ) {
    setRows((current) =>
      current.map((item) => (item.id === rowId ? { ...item, ...patch } : item)),
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <AdminPageHeader
        action={
          <button
            className={formButtonPrimaryCompactClassName}
            disabled={pending}
            type="button"
            onClick={() => setUploadOpen(true)}
          >
            Upload
          </button>
        }
        description="Add one or more people. Each person gets their own invite link."
        title="Send Invites"
      />
      <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <p className={formLabelClassName}>Invitees</p>
            <button
              className={formButtonSecondaryCompactClassName}
              disabled={pending}
              type="button"
              onClick={() => setRows((current) => [...current, createRow()])}
            >
              <span className="inline-flex items-center gap-1">
                <Plus
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.75}
                />
                Add
              </span>
            </button>
          </div>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-sm border border-zinc-300 p-3 dark:border-zinc-600 sm:flex-row sm:items-end"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label
                    className={`text-sm ${formLabelClassName}`}
                    htmlFor={`${baseId}-email-${row.id}`}
                  >
                    Email
                  </label>
                  <input
                    aria-label={`Email ${index + 1}`}
                    className={`${formInputClassName} w-full min-w-0`}
                    disabled={pending}
                    id={`${baseId}-email-${row.id}`}
                    name={`email-${row.id}`}
                    placeholder="Enter an email..."
                    type="email"
                    value={row.email}
                    onChange={(event) =>
                      updateRow(row.id, { email: event.target.value })
                    }
                  />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <label
                    className={`text-sm ${formLabelClassName}`}
                    htmlFor={`${baseId}-name-${row.id}`}
                  >
                    Name Hint
                  </label>
                  <input
                    aria-label={`Name Hint ${index + 1}`}
                    className={`${formInputClassName} w-full min-w-0`}
                    disabled={pending}
                    id={`${baseId}-name-${row.id}`}
                    name={`nameHint-${row.id}`}
                    placeholder="Optional display name..."
                    type="text"
                    value={row.nameHint}
                    onChange={(event) =>
                      updateRow(row.id, { nameHint: event.target.value })
                    }
                  />
                </div>
              </div>
              {rows.length > 1 ? (
                <button
                  aria-label={`Remove invitee ${index + 1}`}
                  className={`${formButtonSecondaryClassName} shrink-0 self-end px-2`}
                  disabled={pending}
                  type="button"
                  onClick={() =>
                    setRows((current) =>
                      current.filter((item) => item.id !== row.id),
                    )
                  }
                >
                  <Trash2
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={1.75}
                  />
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {error ? (
          <p className={formErrorClassName} role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid w-full grid-cols-2 gap-2">
          <button
            className={`${formButtonSecondaryClassName} w-full justify-center`}
            disabled={pending}
            type="button"
            onClick={() => router.back()}
          >
            Cancel
          </button>
          <button
            className={`${formButtonPrimaryClassName} w-full justify-center`}
            disabled={pending}
            type="submit"
          >
            {pending ? "Sending…" : "Send Invites"}
          </button>
        </div>
      </form>
      <InviteCsvUploadDialog
        open={uploadOpen}
        onCancel={() => setUploadOpen(false)}
        onImport={(invites: ParsedInviteRow[]) => {
          setUploadOpen(false);
          setRows(
            invites.map((invite) =>
              createRow(invite.email, invite.nameHint ?? ""),
            ),
          );
          toast(
            invites.length === 1
              ? "Loaded 1 invite from file."
              : `Loaded ${invites.length} invites from file.`,
          );
        }}
      />
    </div>
  );
}
