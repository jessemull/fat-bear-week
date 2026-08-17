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
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className={`${formPageClassName} max-w-sm justify-center pb-24`}>
      <LoginPanel joined={params.joined === "1"} />
    </main>
  );
}
