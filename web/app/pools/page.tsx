import { redirect } from "next/navigation";

import { CreatePoolForm } from "@/components/pools/CreatePoolForm";
import { PoolList } from "@/components/pools/PoolList";
import {
  formHeadingClassName,
  formMutedClassName,
  formPageClassName,
} from "@/lib/form-styles";
import { listPoolsForUser } from "@/lib/pools.server";
import { getSession } from "@/lib/sessions.server";

export const dynamic = "force-dynamic";

export default async function PoolsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const pools = await listPoolsForUser({
    isCommissioner: session.isCommissioner,
    userId: session.id,
  });

  return (
    <main className={formPageClassName}>
      <header className="flex flex-col gap-2">
        <h1 className={`text-3xl ${formHeadingClassName}`}>Your pools</h1>
        <p className={formMutedClassName}>Signed in as {session.name}</p>
      </header>
      <PoolList pools={pools} />
      {session.isCommissioner ? (
        <section className="flex flex-col gap-4 border-t border-zinc-200 pt-8 dark:border-zinc-700">
          <h2 className={`text-xl ${formHeadingClassName}`}>Create a pool</h2>
          <CreatePoolForm />
        </section>
      ) : null}
    </main>
  );
}
