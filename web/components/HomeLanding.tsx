import { PawPrint } from "lucide-react";
import Link from "next/link";

export function HomeLanding() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-24 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl text-center">
        <p
          aria-hidden="true"
          className="mb-4 flex justify-center text-amber-700 dark:text-amber-400"
        >
          <PawPrint className="size-12" strokeWidth={1.5} />
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Fat Bear Week
        </h1>
        <p className="mt-2 text-lg font-medium text-amber-700 dark:text-amber-400">
          Fantasy Bracket
        </p>
        <p className="mt-6 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Think you know who&apos;s going all the way? Private invite-only pools,
          beautiful brackets, and live leaderboards around the official Fat Bear
          Week tournament.
        </p>
        <p className="mt-8">
          <Link
            className="text-sm font-medium text-amber-800 underline dark:text-amber-400"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
