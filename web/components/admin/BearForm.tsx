"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import {
  formButtonPrimaryClassName,
  formErrorClassName,
  formInputClassName,
  formLabelClassName,
} from "@/lib/form-styles";

interface BearFormProps {
  tournamentId: string;
}

export function BearForm({ tournamentId }: BearFormProps) {
  const router = useRouter();
  const [error, setError] = useState<null | string>(null);
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [number, setNumber] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const body: {
        name: string;
        nickname?: null | string;
        number?: null | number;
      } = { name };

      if (nickname.trim()) {
        body.nickname = nickname.trim();
      }

      if (number.trim()) {
        body.number = Number(number);
      }

      const response = await fetch(
        `/api/admin/tournaments/${tournamentId}/bears`,
        {
          body: JSON.stringify(body),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      );
      const json = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(json.error ?? "Unable to create bear.");
        return;
      }

      setName("");
      setNickname("");
      setNumber("");
      router.refresh();
    } catch {
      setError("Unable to create bear right now.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="flex w-full max-w-lg flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-name">
          Name
        </label>
        <input
          className={formInputClassName}
          id="bear-name"
          name="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-number">
          Number (optional)
        </label>
        <input
          className={formInputClassName}
          id="bear-number"
          min={0}
          name="number"
          type="number"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className={formLabelClassName} htmlFor="bear-nickname">
          Nickname (optional)
        </label>
        <input
          className={formInputClassName}
          id="bear-nickname"
          name="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
        />
      </div>
      {error ? (
        <p className={formErrorClassName} role="alert">
          {error}
        </p>
      ) : null}
      <button
        className={formButtonPrimaryClassName}
        disabled={pending}
        type="submit"
      >
        {pending ? "Creating…" : "Create bear"}
      </button>
    </form>
  );
}
