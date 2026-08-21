"use client";

import { Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  AdminPageHeader,
  AdminPageHeaderButtonAction,
} from "@/components/admin/AdminPageHeader";
import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import {
  InviteCsvUploadDialog,
  type ParsedInviteRow,
} from "@/components/pools/InviteCsvUploadDialog";
import { InviteLinkFallback } from "@/components/pools/InviteLinkFallback";
import { useToast } from "@/components/Toast";
import { MAX_BULK_INVITES } from "@/lib/auth-schemas";
import { cn } from "@/lib/cn";
import {
  formActionsClassNames,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formIconButtonSecondaryClassName,
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
/** Form gap + actions mt + admin main bottom padding. */
const LIST_BOTTOM_GAP_PX = 56;

export function SendInvitesPanel({ poolId }: SendInvitesPanelProps) {
  const router = useRouter();
  const { toast, toastAfterNavigation } = useToast();
  const baseId = useId();
  const actionsRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const nextRowId = useRef(1);
  const [error, setError] = useState<null | string>(null);
  const [failedInviteUrls, setFailedInviteUrls] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [rows, setRows] = useState<InviteRow[]>([INITIAL_ROW]);
  const [uploadKey, setUploadKey] = useState(0);
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

  useLayoutEffect(() => {
    function updateListMaxHeight() {
      const list = listRef.current;
      const actions = actionsRef.current;

      if (!list || !actions) {
        return;
      }

      const listEl = list;
      const actionsEl = actions;

      function measure() {
        const listTop = listEl.getBoundingClientRect().top;
        const actionsHeight = actionsEl.getBoundingClientRect().height;
        const available =
          window.innerHeight - listTop - actionsHeight - LIST_BOTTOM_GAP_PX;

        listEl.style.maxHeight = `${Math.max(available, 12 * 16)}px`;

        const pageOverflow =
          document.documentElement.scrollHeight - window.innerHeight;

        if (pageOverflow > 0) {
          listEl.style.maxHeight = `${Math.max(listEl.clientHeight - pageOverflow, 12 * 16)}px`;
        }
      }

      measure();
      // Clamping the list can move the actions; measure again after layout.
      window.requestAnimationFrame(measure);
    }

    updateListMaxHeight();
    window.addEventListener("resize", updateListMaxHeight);

    return () => {
      window.removeEventListener("resize", updateListMaxHeight);
    };
  }, [error, rows.length]);

  useEffect(() => {
    const list = listRef.current;

    if (!list) {
      return;
    }

    if (list.scrollHeight > list.clientHeight) {
      list.scrollTo({
        behavior: "smooth",
        top: list.scrollHeight,
      });
    }
  }, [rows.length]);

  async function submitInvites(
    invites: { email: string; nameHint: null | string }[],
  ) {
    setError(null);
    setFailedInviteUrls([]);
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
            inviteUrl?: string;
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
        setFailedInviteUrls(
          sendFailures
            .map((result) => result.inviteUrl)
            .filter((url): url is string => Boolean(url)),
        );
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

      setFailedInviteUrls([]);
      toastAfterNavigation(
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

    if (uniqueInvites.length > MAX_BULK_INVITES) {
      setError(`You can send at most ${MAX_BULK_INVITES} invites at once.`);
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
    <FormShell>
      <AdminPageHeader
        action={
          <AdminPageHeaderButtonAction
            disabled={pending}
            icon={Upload}
            label="Upload"
            onClick={() => {
              setUploadKey((current) => current + 1);
              setUploadOpen(true);
            }}
          />
        }
        description="Add one or more people. Each person gets their own invite link. Large lists (up to 100) may take up to about a minute to send."
        title="Send Invites"
      />
      <form className="flex w-full flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className={formLabelClassName}>Invitees</p>
            <button
              aria-label="Add"
              className={formIconButtonSecondaryClassName}
              disabled={pending}
              type="button"
              onClick={() => setRows((current) => [...current, createRow()])}
            >
              <Plus
                aria-hidden="true"
                className="size-5 md:hidden"
                strokeWidth={1.75}
              />
              <span className="hidden items-center gap-1 md:inline-flex">
                Add
                <Plus
                  aria-hidden="true"
                  className="size-3.5"
                  strokeWidth={1.75}
                />
              </span>
            </button>
          </div>
          <div
            className="subtle-scrollbar flex flex-col gap-3 overflow-y-auto overscroll-contain pr-1 @min-[512px]:gap-0 @min-[512px]:border-t @min-[512px]:border-zinc-300 @min-[512px]:dark:border-zinc-600"
            ref={listRef}
          >
            {rows.map((row, index) => (
              <div
                key={row.id}
                className="relative flex items-start gap-2 rounded-sm border border-zinc-300 p-3 dark:border-zinc-600 @min-[512px]:rounded-none @min-[512px]:border-x-0 @min-[512px]:border-t-0 @min-[512px]:px-0 @min-[512px]:py-4"
              >
                <div
                  className={cn(
                    "grid min-w-0 flex-1 grid-cols-1 gap-2 @min-[512px]:grid-cols-[auto_1fr] @min-[512px]:items-center @min-[512px]:gap-x-3",
                    rows.length > 1 && "pr-10 @min-[512px]:pr-0",
                  )}
                >
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
                {rows.length > 1 ? (
                  <button
                    aria-label={`Remove invitee ${index + 1}`}
                    className={cn(
                      "absolute top-3 right-3 inline-flex size-8 shrink-0 cursor-pointer items-start justify-end text-zinc-500 transition-colors hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-400 dark:hover:text-zinc-100",
                      "@min-[512px]:static @min-[512px]:items-center @min-[512px]:justify-center @min-[512px]:rounded-md @min-[512px]:border @min-[512px]:border-zinc-300 @min-[512px]:px-2 @min-[512px]:text-zinc-900 @min-[512px]:hover:bg-zinc-100 @min-[512px]:dark:border-zinc-600 @min-[512px]:dark:text-zinc-100 @min-[512px]:dark:hover:bg-zinc-800",
                    )}
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
        </div>
        {error ? (
          <p className={formErrorClassName} role="alert">
            {error}
          </p>
        ) : null}
        {failedInviteUrls.length > 0 ? (
          <div className="flex flex-col gap-3">
            {failedInviteUrls.map((inviteUrl) => (
              <InviteLinkFallback key={inviteUrl} inviteUrl={inviteUrl} />
            ))}
          </div>
        ) : null}
        <div className={formActionsClassNames.lg} ref={actionsRef}>
          <button
            className={`${formButtonSecondaryClassName} w-full justify-center`}
            disabled={pending}
            type="button"
            onClick={() => router.push(`/admin/pools/${poolId}/invites`)}
          >
            Cancel
          </button>
          <button
            className={`${formButtonPrimaryClassName} w-full justify-center`}
            disabled={pending}
            type="submit"
          >
            {pending ? (
              <ButtonPendingLabel>Sending…</ButtonPendingLabel>
            ) : (
              "Send Invites"
            )}
          </button>
        </div>
      </form>
      <InviteCsvUploadDialog
        key={uploadKey}
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
    </FormShell>
  );
}
