import Link from "next/link";

import { ResetPasswordPanel } from "@/components/auth/ResetPasswordPanel";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { getPasswordResetByToken } from "@/lib/password-reset.server";

export const dynamic = "force-dynamic";

interface ResetPasswordPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function ResetPasswordPage({
  params,
}: ResetPasswordPageProps) {
  const { token } = await params;
  const reset = await getPasswordResetByToken(token);

  if (!reset) {
    return (
      <main
        className={`${formPageClassName} max-w-sm justify-center text-center`}
      >
        <div className="flex flex-col gap-2">
          <h1 className={`text-2xl ${formHeadingClassName}`}>
            Reset link not found
          </h1>
          <p className={formMutedClassName}>
            This reset link is invalid.{" "}
            <Link className={formLinkClassName} href="/forgot-password">
              Request a new one
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  if (reset.status === "used") {
    return (
      <main
        className={`${formPageClassName} max-w-sm justify-center text-center`}
      >
        <div className="flex flex-col gap-2">
          <h1 className={`text-2xl ${formHeadingClassName}`}>
            Reset link already used
          </h1>
          <p className={formMutedClassName}>
            This reset link has already been used.{" "}
            <Link className={formLinkClassName} href="/forgot-password">
              Request a new one
            </Link>{" "}
            or{" "}
            <Link className={formLinkClassName} href="/login">
              sign in
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  if (reset.status === "expired") {
    return (
      <main
        className={`${formPageClassName} max-w-sm justify-center text-center`}
      >
        <div className="flex flex-col gap-2">
          <h1 className={`text-2xl ${formHeadingClassName}`}>
            Reset link expired
          </h1>
          <p className={formMutedClassName}>
            Ask for a new reset email, or{" "}
            <Link className={formLinkClassName} href="/login">
              sign in
            </Link>{" "}
            if you remember your password.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className={`${formPageClassName} max-w-sm justify-center pb-24`}>
      <ResetPasswordPanel token={token} />
    </main>
  );
}
