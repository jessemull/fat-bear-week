"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { MAX_BULK_INVITES } from "@/lib/auth-schemas";
import { cn } from "@/lib/cn";
import {
  formActionsMdClassName,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formHeadingClassName,
  formMutedClassName,
  formWidthMdShellClassName,
} from "@/lib/form-styles";

export interface ParsedInviteRow {
  email: string;
  nameHint: null | string;
}

interface InviteCsvUploadDialogProps {
  onCancel: () => void;
  onImport: (invites: ParsedInviteRow[]) => void;
  open: boolean;
}

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const EMAIL_FIND_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const EMAIL_HEADERS = new Set(["e-mail", "email", "emails", "mail"]);
const NAME_HEADERS = new Set([
  "display name",
  "display_name",
  "name",
  "name hint",
  "name_hint",
  "nickname",
  "nick",
]);

/**
 * Decode TextEdit-friendly encodings (UTF-8 / UTF-16 with BOM).
 */
export async function readInviteFileText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return new TextDecoder("utf-16le").decode(bytes);
  }

  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(bytes);
  }

  // UTF-16 LE without BOM (common from macOS TextEdit "Unicode")
  if (
    bytes.length >= 4 &&
    bytes[1] === 0x00 &&
    bytes[3] === 0x00 &&
    bytes[0] !== 0x00
  ) {
    return new TextDecoder("utf-16le").decode(bytes);
  }

  return new TextDecoder("utf-8").decode(bytes);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }

      continue;
    }

    if ((char === "," || char === ";" || char === "\t") && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());

  return cells.map((cell) => cell.replace(/^["']|["']$/g, "").trim());
}

function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ");
}

/**
 * Parse invite CSV / plain text into email + optional name rows.
 *
 * Supported:
 * - Excel/Sheets CSV with headers: email,name (also nickname / name_hint)
 * - Two-column rows without headers: email,name or name,email
 * - Email-only lists (one per line, or comma-separated emails)
 */
export function parseInviteCsv(text: string): ParsedInviteRow[] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\u0000/g, "");
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const rows = lines.map(splitCsvLine);
  const header = rows[0]?.map(normalizeHeader) ?? [];
  const emailHeaderIndex = header.findIndex((cell) => EMAIL_HEADERS.has(cell));
  const nameHeaderIndex = header.findIndex((cell) => NAME_HEADERS.has(cell));
  const hasHeader = emailHeaderIndex >= 0;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const invites: ParsedInviteRow[] = [];

  for (const cells of dataRows) {
    const nonEmpty = cells.filter(Boolean);

    if (nonEmpty.length === 0) {
      continue;
    }

    if (hasHeader) {
      const email = (cells[emailHeaderIndex] ?? "").trim().toLowerCase();
      const nameHint =
        nameHeaderIndex >= 0
          ? (cells[nameHeaderIndex] ?? "").trim() || null
          : null;

      if (email && isEmail(email)) {
        invites.push({ email, nameHint });
      }

      continue;
    }

    const emailCells = nonEmpty.filter((cell) => isEmail(cell));

    if (emailCells.length > 1 && emailCells.length === nonEmpty.length) {
      for (const email of emailCells) {
        invites.push({ email: email.toLowerCase(), nameHint: null });
      }

      continue;
    }

    if (emailCells.length === 1) {
      const email = emailCells[0].toLowerCase();
      const nameHint =
        nonEmpty.find((cell) => cell.toLowerCase() !== email)?.trim() || null;

      invites.push({ email, nameHint });
      continue;
    }

    const matches = nonEmpty.join(" ").match(EMAIL_FIND_PATTERN) ?? [];

    for (const email of matches) {
      invites.push({ email: email.toLowerCase(), nameHint: null });
    }
  }

  const byEmail = new Map<string, ParsedInviteRow>();

  for (const invite of invites) {
    if (!byEmail.has(invite.email)) {
      byEmail.set(invite.email, invite);
    }
  }

  return [...byEmail.values()];
}

function looksLikeRtf(fileName: string, text: string): boolean {
  return fileName.toLowerCase().endsWith(".rtf") || /^\s*\{\\rtf/i.test(text);
}

export function InviteCsvUploadDialog({
  onCancel,
  onImport,
  open,
}: InviteCsvUploadDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<null | string>(null);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    cancelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        onCancel();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled])',
        ),
      ];

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel, open, pending]);

  if (!open) {
    return null;
  }

  function onFileChange(file: File | null) {
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      setSelectedFile(null);

      if (fileRef.current) {
        fileRef.current.value = "";
      }

      setError(
        "Excel files are not supported. Export as CSV (.csv) from Excel or Google Sheets, then upload that file.",
      );
      return;
    }

    setSelectedFile(file);
  }

  async function onUpload() {
    if (!selectedFile) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const text = await readInviteFileText(selectedFile);

      if (looksLikeRtf(selectedFile.name, text)) {
        setError(
          "That looks like a TextEdit rich text (.rtf) file. In TextEdit choose Format → Make Plain Text, save, then upload the .txt file.",
        );
        return;
      }

      const invites = parseInviteCsv(text);

      if (invites.length === 0) {
        setError(
          "No email addresses found. Use a CSV with email,name columns or a plain list of emails.",
        );
        return;
      }

      if (invites.length > MAX_BULK_INVITES) {
        setError(`You can send at most ${MAX_BULK_INVITES} invites at once.`);
        return;
      }

      onImport(invites);
    } catch {
      setError("Unable to read that file.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        aria-label="Dismiss upload"
        className="absolute inset-0 cursor-pointer bg-zinc-950/60"
        disabled={pending}
        type="button"
        onClick={onCancel}
      />
      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-10 rounded-md border border-zinc-300 bg-white p-5 shadow-xl dark:border-zinc-600 dark:bg-zinc-950 ${formWidthMdShellClassName}`}
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex flex-col gap-2">
          <h2 className={`text-lg ${formHeadingClassName}`} id={titleId}>
            Upload invites
          </h2>
          <p className={`text-sm ${formMutedClassName}`} id={descriptionId}>
            Best option: export a CSV from Excel or Google Sheets with columns{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              email
            </span>
            ,{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              name
            </span>
            . Email-only lists also work. Native Excel (.xlsx) is not supported.
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <input
            accept=".csv,.rtf,.text,.txt,text/*,text/csv,text/plain,text/rtf"
            aria-label="Email list file"
            className="sr-only"
            disabled={pending}
            ref={fileRef}
            type="file"
            onChange={(event) => {
              onFileChange(event.target.files?.[0] ?? null);
            }}
          />
          <div className="flex min-w-0 flex-col gap-2 @min-[448px]:flex-row @min-[448px]:items-center @min-[448px]:gap-3">
            <button
              className={`${formButtonPrimaryClassName} w-full @min-[448px]:w-auto @min-[448px]:shrink-0`}
              disabled={pending}
              type="button"
              onClick={() => fileRef.current?.click()}
            >
              Choose file
            </button>
            <p
              className={`min-w-0 truncate text-sm ${selectedFile ? "text-zinc-900 dark:text-zinc-100" : formMutedClassName}`}
            >
              {selectedFile?.name ?? "No file chosen."}
            </p>
          </div>
          {error ? (
            <p className={formErrorClassName} role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <div className={cn(formActionsMdClassName, "mt-5")}>
          <button
            className={`${formButtonSecondaryClassName} w-full justify-center`}
            disabled={pending}
            ref={cancelRef}
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`${formButtonPrimaryClassName} w-full justify-center`}
            disabled={pending || !selectedFile}
            type="button"
            onClick={() => void onUpload()}
          >
            {pending ? (
              <ButtonPendingLabel>Reading file…</ButtonPendingLabel>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
