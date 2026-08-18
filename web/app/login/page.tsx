import { redirect } from "next/navigation";

import { LoginPanel } from "@/components/auth/LoginPanel";
import { formPageClassName } from "@/lib/form-styles";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{
    joined?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const joined = params.joined === "1";
  const session = await getSession();

  // After join-without-session, always show sign-in (even if a prior cookie remains).
  if (session && !joined) {
    redirect("/");
  }

  return (
    <main className={`${formPageClassName} max-w-sm justify-center pb-24`}>
      <LoginPanel joined={joined} />
    </main>
  );
}
