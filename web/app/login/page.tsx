import Link from "next/link";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/auth/SignInForm";
import {
  formHeadingClassName,
  formLinkClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/pools");
  }

  return (
    <main className={`${formPageClassName} max-w-lg justify-center`}>
      <div className="flex flex-col gap-2 text-center">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Sign in</h1>
        <p className={formMutedClassName}>
          Returning players only. There is no public registration — join with
          your personal invite link.
        </p>
      </div>
      <SignInForm />
      <p className={`text-center text-sm ${formMutedClassName}`}>
        <Link className={formLinkClassName} href="/">
          Back home
        </Link>
      </p>
    </main>
  );
}
