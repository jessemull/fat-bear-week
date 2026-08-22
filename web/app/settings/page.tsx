import { redirect } from "next/navigation";

import { AccountPasswordForm } from "@/components/settings/AccountPasswordForm";
import { AccountProfileForm } from "@/components/settings/AccountProfileForm";
import { getAccount } from "@/lib/account.server";
import {
  appMainPaddingClassName,
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const account = await getAccount(session.id);

  if (!account) {
    redirect("/login");
  }

  return (
    <main className={`flex-1 ${appMainPaddingClassName}`}>
      <div className="flex w-full max-w-lg flex-col gap-8 text-zinc-900 dark:text-zinc-50">
        <header className="flex flex-col gap-2">
          <h1 className={`text-3xl ${formHeadingClassName}`}>Account</h1>
          <p className={`text-sm ${formMutedClassName}`}>
            Your display name and password for this site.
          </p>
        </header>
        <AccountProfileForm email={account.email} name={account.name} />
        <AccountPasswordForm />
      </div>
    </main>
  );
}
