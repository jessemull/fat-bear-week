import type { ReactNode } from "react";

import { Pencil } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import { formHeadingClassName, formMutedClassName } from "@/lib/form-styles";

interface CardBadgeProps {
  children: ReactNode;
  className?: string;
  tone?: "accent" | "default" | "muted";
}

interface CardHeaderProps {
  badge?: ReactNode;
  className?: string;
  showEdit?: boolean;
  title: ReactNode;
}

interface CardMetaProps {
  children: ReactNode;
  className?: string;
}

interface CardListProps {
  children: ReactNode;
  className?: string;
}

interface CardProps {
  children: ReactNode;
  className?: string;
  href?: string;
}

const cardClassName =
  "block min-h-[4.75rem] rounded-xl border border-zinc-200 bg-white px-[1.125rem] py-4 text-left dark:border-zinc-700 dark:bg-zinc-900";

const cardLinkClassName =
  "transition-colors hover:border-amber-600/50 hover:bg-amber-50/80 focus-visible:border-amber-600/50 focus-visible:bg-amber-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/60 dark:hover:border-amber-600/40 dark:hover:bg-zinc-800 dark:focus-visible:border-amber-600/40 dark:focus-visible:bg-zinc-800 dark:focus-visible:ring-amber-500/50";

const badgeToneClassName = {
  accent:
    "border-amber-700/30 bg-amber-700/10 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
  default:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  muted:
    "border-zinc-200 bg-transparent text-zinc-500 dark:border-zinc-700 dark:text-zinc-400",
} as const;

export function Card({ children, className, href }: CardProps) {
  if (href) {
    return (
      <Link className={cn(cardClassName, cardLinkClassName, className)} href={href}>
        {children}
      </Link>
    );
  }

  return <div className={cn(cardClassName, className)}>{children}</div>;
}

export function CardBadge({
  children,
  className,
  tone = "default",
}: CardBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[11px] font-semibold tracking-[0.04em] uppercase",
        badgeToneClassName[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CardHeader({
  badge,
  className,
  showEdit = true,
  title,
}: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <h2
        className={cn(
          "min-w-0 flex-1 truncate text-lg leading-snug",
          formHeadingClassName,
        )}
      >
        {title}
      </h2>
      <div className="flex shrink-0 items-center gap-2">
        {badge}
        {showEdit ? (
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-md text-amber-800 dark:text-amber-400"
          >
            <Pencil className="size-4" strokeWidth={1.75} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function CardMeta({ children, className }: CardMetaProps) {
  return (
    <p className={cn(`mt-1 truncate text-sm ${formMutedClassName}`, className)}>
      {children}
    </p>
  );
}

export function CardList({ children, className }: CardListProps) {
  return (
    <ul className={cn("mt-2 flex flex-col gap-3", className)}>{children}</ul>
  );
}
