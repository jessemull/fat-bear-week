import { appMainPaddingClassName } from "@/lib/form-styles";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      className={`flex-1 ${appMainPaddingClassName}`}
      role="status"
    >
      <div className="flex w-full max-w-lg flex-col gap-4">
        <span className="sr-only">Loading account settings…</span>
        <div className="h-8 w-40 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-64 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-2 h-8 w-full max-w-lg animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-full max-w-lg animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-8 w-full max-w-lg animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
