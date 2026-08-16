/** Shared form chrome that stays readable in light and dark mode. */

export const formLabelClassName =
  "text-base font-medium text-zinc-900 dark:text-zinc-100";

export const formInputClassName =
  "h-8 rounded-md border border-zinc-300 bg-white px-2.5 py-0 text-sm text-zinc-900 leading-8 [appearance:textfield] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const formTextareaClassName =
  "min-h-28 rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50";

export const formSelectClassName =
  "h-8 w-full appearance-none rounded-md border border-zinc-300 bg-white py-0 pr-8 pl-2.5 text-sm text-zinc-900 leading-8 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-500 dark:disabled:hover:border-zinc-600 cursor-pointer";

export const formHeadingClassName =
  "font-semibold text-zinc-900 dark:text-zinc-50";

export const formMutedClassName = "text-zinc-600 dark:text-zinc-400";

export const formActionsClassName =
  "mt-2 grid w-full grid-cols-2 gap-2";

export const formButtonPrimaryClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-amber-700 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 dark:disabled:hover:bg-amber-600";

export const formButtonSecondaryClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-2.5 text-sm text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:disabled:hover:bg-transparent";

export const formButtonDangerClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-red-300 px-2.5 text-sm text-red-800 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/60 dark:disabled:hover:bg-transparent";

export const formErrorClassName = "text-sm text-red-700 dark:text-red-400";

export const formLinkClassName =
  "text-amber-800 underline dark:text-amber-400";

export const formPageClassName =
  "mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12 text-zinc-900 dark:text-zinc-50";
