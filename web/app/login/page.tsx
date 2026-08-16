import { redirect } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { formPageClassName } from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className={`${formPageClassName} max-w-sm justify-center pb-24`}>
      <LoginPanel />
    </main>
  );
}
