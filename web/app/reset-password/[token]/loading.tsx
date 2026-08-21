import { appCenteredPagePaddingClassName } from "@/lib/form-styles";

export default function Loading() {
  return (
    <main
      aria-busy="true"
      className={`mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 ${appCenteredPagePaddingClassName}`}
      role="status"
    >
      <span className="sr-only">Loading password reset…</span>
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-2 h-8 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-8 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
    </main>
  );
}
