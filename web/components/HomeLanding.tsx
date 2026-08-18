import { PawPrint } from "lucide-react";

export function HomeLanding() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-28 dark:bg-zinc-950 sm:px-10">
      <div className="mx-auto max-w-3xl text-center">
        <p
          aria-hidden="true"
          className="mb-5 flex justify-center text-amber-700 dark:text-amber-400"
        >
          <PawPrint className="size-14" strokeWidth={1.5} />
        </p>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
          Fat Bear Week
        </h1>
        <p className="mt-3 text-xl font-medium text-amber-700 dark:text-amber-400">
          Fantasy Bracket
        </p>
        <p className="mt-8 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          Think you know who&apos;s going all the way? Private invite-only pools,
          beautiful brackets, and live leaderboards around the official Fat Bear
          Week tournament.
        </p>
      </div>
    </main>
  );
}
