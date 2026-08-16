"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { formButtonSecondaryClassName } from "@/lib/form-styles";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);

    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className={formButtonSecondaryClassName}
      disabled={pending}
      type="button"
      onClick={onClick}
    >
      {pending ? (
        <ButtonPendingLabel>Signing out…</ButtonPendingLabel>
      ) : (
        "Sign out"
      )}
    </button>
  );
}
