"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import { useToast } from "@/components/Toast";
import { formButtonSecondaryClassName } from "@/lib/form-styles";

export function SignOutButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);

    try {
      const response = await fetch("/api/auth/sign-out", { method: "POST" });

      if (!response.ok) {
        toast("Unable to sign out. Try again.", "error");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      toast("Unable to sign out. Try again.", "error");
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
