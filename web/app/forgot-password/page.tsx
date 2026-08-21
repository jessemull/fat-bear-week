import { redirect } from "next/navigation";

import { ForgotPasswordPanel } from "@/components/auth/ForgotPasswordPanel";
import { formPageClassName } from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  const session = await getSession();

  if (session) {
    redirect("/settings");
  }

  return (
    <main className={`${formPageClassName} max-w-sm justify-center pb-24`}>
      <ForgotPasswordPanel />
    </main>
  );
}
