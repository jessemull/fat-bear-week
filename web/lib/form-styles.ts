/** Shared form chrome that stays readable in light and dark mode. */

export const formLabelClassName =
  "text-base font-medium text-zinc-900 dark:text-zinc-100";

export const formInputClassName =
  "h-8 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-0 text-sm text-zinc-900 leading-8 [appearance:textfield] dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

export const formTextareaClassName =
  "min-h-28 w-full rounded-md border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50";

export const formSelectClassName =
  "h-8 w-full appearance-none rounded-md border border-zinc-300 bg-white py-0 pr-8 pl-2.5 text-sm text-zinc-900 leading-8 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:border-zinc-500 dark:disabled:hover:border-zinc-600 cursor-pointer";

export const formHeadingClassName =
  "font-semibold text-zinc-900 dark:text-zinc-50";

export const formMutedClassName = "text-zinc-600 dark:text-zinc-400";

/** max-w-xs (320px): stack actions until the form shell reaches its design width. */

export const formWidthXsShellClassName = "@container w-full max-w-xs";

export const formShellXsClassName = `${formWidthXsShellClassName} flex flex-col gap-3`;

export const formActionsXsClassName =
  "mt-2 flex w-full flex-col-reverse gap-2 @min-[320px]:grid @min-[320px]:grid-cols-2";

/** max-w-sm (384px) */

export const formWidthSmShellClassName = "@container w-full max-w-sm";

export const formShellSmClassName = `${formWidthSmShellClassName} flex flex-col gap-4`;

export const formActionsSmClassName =
  "mt-2 flex w-full flex-col-reverse gap-2 @min-[384px]:grid @min-[384px]:grid-cols-2";

/** max-w-md (448px) — confirm / upload dialogs */

export const formWidthMdShellClassName = "@container w-full max-w-md";

export const formActionsMdClassName =
  "mt-2 flex w-full flex-col-reverse gap-2 @min-[448px]:grid @min-[448px]:grid-cols-2";

/** max-w-lg (512px) — pool, bear, invite edit */

export const formWidthLgShellClassName = "@container w-full max-w-lg";

export const formShellLgClassName = `${formWidthLgShellClassName} flex flex-col gap-4`;

export const formActionsLgClassName =
  "mt-2 flex w-full flex-col-reverse gap-2 @min-[512px]:grid @min-[512px]:grid-cols-2";

export const formStandaloneActionLgClassName =
  "flex w-full flex-col items-stretch gap-3 @min-[512px]:w-fit @min-[512px]:items-start";

/** max-w-2xl (672px) — bulk invite panel */

export const formWidth2xlShellClassName = "@container w-full max-w-2xl";

export const formShell2xlClassName = `${formWidth2xlShellClassName} flex flex-col gap-4`;

export const formActions2xlClassName =
  "mt-2 flex w-full flex-col-reverse gap-2 @min-[672px]:grid @min-[672px]:grid-cols-2";

export const formStandaloneActionButtonClassName =
  "w-full @min-[512px]:w-auto";

export const formStandaloneActionButtonMdClassName =
  "w-full @min-[448px]:w-auto";

export const formStandaloneActionXsClassName =
  "flex w-full flex-col items-stretch gap-3 @min-[320px]:w-fit @min-[320px]:items-start";

export const formStandaloneActionButtonXsClassName =
  "w-full @min-[320px]:w-auto";

export const formStandaloneActionSmClassName =
  "flex w-full flex-col items-stretch gap-3 @min-[384px]:w-fit @min-[384px]:items-start";

export const formStandaloneActionButtonSmClassName =
  "w-full @min-[384px]:w-auto";

export const formStandaloneActionMdClassName =
  "flex w-full flex-col items-stretch gap-3 @min-[448px]:w-fit @min-[448px]:items-start";

export const formStandaloneAction2xlClassName =
  "flex w-full flex-col items-stretch gap-3 @min-[672px]:w-fit @min-[672px]:items-start";

export const formStandaloneActionButton2xlClassName =
  "w-full @min-[672px]:w-auto";

export type FormWidthTier = "2xl" | "lg" | "md" | "sm" | "xs";

/** Standard width for admin page forms (matches pool settings). */
export const defaultFormWidthTier: FormWidthTier = "lg";

export const formShellClassNames: Record<FormWidthTier, string> = {
  "2xl": formShell2xlClassName,
  lg: formShellLgClassName,
  md: `${formWidthMdShellClassName} flex flex-col gap-4`,
  sm: formShellSmClassName,
  xs: formShellXsClassName,
};

export const formWidthShellClassNames: Record<FormWidthTier, string> = {
  "2xl": formWidth2xlShellClassName,
  lg: formWidthLgShellClassName,
  md: formWidthMdShellClassName,
  sm: formWidthSmShellClassName,
  xs: formWidthXsShellClassName,
};

export const formActionsClassNames: Record<FormWidthTier, string> = {
  "2xl": formActions2xlClassName,
  lg: formActionsLgClassName,
  md: formActionsMdClassName,
  sm: formActionsSmClassName,
  xs: formActionsXsClassName,
};

export const formStandaloneActionClassNames: Record<FormWidthTier, string> = {
  "2xl": formStandaloneAction2xlClassName,
  lg: formStandaloneActionLgClassName,
  md: formStandaloneActionMdClassName,
  sm: formStandaloneActionSmClassName,
  xs: formStandaloneActionXsClassName,
};

export const formStandaloneActionButtonClassNames: Record<FormWidthTier, string> =
  {
    "2xl": formStandaloneActionButton2xlClassName,
    lg: formStandaloneActionButtonClassName,
    md: formStandaloneActionButtonMdClassName,
    sm: formStandaloneActionButtonSmClassName,
    xs: formStandaloneActionButtonXsClassName,
  };

export const formActionsClassName = formActionsLgClassName;

export const formStandaloneActionClassName = formStandaloneActionLgClassName;

export const formButtonPrimaryClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md bg-amber-700 px-3 text-sm font-medium text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 dark:disabled:hover:bg-amber-600";

export const formButtonSecondaryClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-zinc-300 px-2.5 text-sm text-zinc-900 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:disabled:hover:bg-transparent";

export const formButtonDangerClassName =
  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-red-600/40 px-2.5 text-sm text-red-600 transition-colors hover:bg-red-600/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent dark:border-red-600/50 dark:text-red-600 dark:hover:bg-red-600/10 dark:disabled:hover:bg-transparent";

export const formErrorClassName =
  "text-sm text-red-600/80 dark:text-red-600/80";

export const formLinkClassName =
  "text-amber-800 underline dark:text-amber-400";

/** Side padding with top matching sides below the fixed mobile header (lg restores py-8). */
export const appMainPaddingClassName =
  "px-4 pt-4 pb-8 sm:px-6 sm:pt-6 lg:py-8";

/** Centered status / auth pages: top matches sides until lg. */
export const appCenteredPagePaddingClassName =
  "px-6 pt-6 pb-24 lg:py-12";

export const formPageClassName =
  `mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 ${appCenteredPagePaddingClassName} text-zinc-900 dark:text-zinc-50`;
