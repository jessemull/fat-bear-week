"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { FormShell } from "@/components/FormShell";
import { useToast } from "@/components/Toast";
import {
  formActionsClassName,
  formButtonPrimaryClassName,
  formButtonSecondaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
  formTextareaClassName,
} from "@/lib/form-styles";

export interface BearFormValues {
  biography: null | string;
  id: string;
  identification: null | string;
  name: string;
  nickname: null | string;
}

interface BearFormProps {
  bear?: BearFormValues;
  mode: "create" | "edit";
  tournamentId: string;
}

interface BearMutationResponse {
  data?: {
    bear?: {
      id: string;
    };
  };
  error?: string;
}

export function BearForm({ bear, mode, tournamentId }: BearFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [biography, setBiography] = useState(bear?.biography ?? "");
  const [error, setError] = useState<null | string>(null);
  const [identification, setIdentification] = useState(
    bear?.identification ?? "",
  );
  const [name, setName] = useState(bear?.name ?? "");
  const [nickname, setNickname] = useState(bear?.nickname ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const body = {
      biography: biography.trim() ? biography.trim() : null,
      identification: identification.trim() ? identification.trim() : null,
      name: name.trim(),
      nickname: nickname.trim() ? nickname.trim() : null,
    };

    try {
      const response =
        mode === "create"
          ? await fetch(`/api/admin/tournaments/${tournamentId}/bears`, {
              body: JSON.stringify(body),
              headers: { "content-type": "application/json" },
              method: "POST",
            })
          : await fetch(`/api/admin/bears/${bear?.id}`, {
              body: JSON.stringify(body),
              headers: { "content-type": "application/json" },
              method: "PATCH",
            });
      const json = (await response.json()) as BearMutationResponse;

      if (!response.ok) {
        setError(
          json.error ??
            (mode === "create"
              ? "Unable to create bear."
              : "Unable to save bear."),
        );
        return;
      }

      if (mode === "create") {
        const bearId = json.data?.bear?.id;

        if (!bearId) {
          setError("Unable to create bear.");
          return;
        }

        router.push(`/admin/tournaments/${tournamentId}/bears/${bearId}`);
        router.refresh();
        toast("Bear created.");
        return;
      }

      toast("Bear saved.");
      router.refresh();
    } catch {
      setError(
        mode === "create"
          ? "Unable to create bear right now."
          : "Unable to save bear right now.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <FormShell as="form" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-name">
          Name
        </label>
        <input
          className={formInputClassName}
          id="bear-name"
          name="name"
          placeholder="Enter a name..."
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-nickname">
          Nickname
        </label>
        <input
          className={formInputClassName}
          id="bear-nickname"
          name="nickname"
          placeholder="Enter a nickname..."
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-identification">
          Identification
        </label>
        <textarea
          className={formTextareaClassName}
          id="bear-identification"
          name="identification"
          placeholder="Physical traits used to recognize this bear..."
          value={identification}
          onChange={(event) => setIdentification(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-biography">
          Biography
        </label>
        <textarea
          className={formTextareaClassName}
          id="bear-biography"
          name="biography"
          placeholder="Life history, family, and Brooks River notes..."
          value={biography}
          onChange={(event) => setBiography(event.target.value)}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <div className={formActionsClassName}>
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
          {pending ? (
            <ButtonPendingLabel>
              {mode === "create" ? "Creating…" : "Saving…"}
            </ButtonPendingLabel>
          ) : mode === "create" ? (
            "Create Bear"
          ) : (
            "Save Bear"
          )}
        </button>
      </div>
    </FormShell>
  );
}
