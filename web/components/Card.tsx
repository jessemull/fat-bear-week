import type { ReactNode } from "react";

import Link from "next/link";

import { cn } from "@/lib/cn";
import { formMutedClassName } from "@/lib/form-styles";

interface CardFieldProps {
  label: string;
  value: ReactNode;
}

interface CardFieldsProps {
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
  "block rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-amber-600/50 hover:bg-amber-50/80 focus-visible:bg-amber-50/80 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-amber-600/40 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800";

export function Card({ children, className, href }: CardProps) {
  const classNames = cn(cardClassName, className);

  if (href) {
    return (
      <Link className={classNames} href={href}>
        {children}
      </Link>
    );
  }

  return <div className={classNames}>{children}</div>;
}

export function CardField({ label, value }: CardFieldProps) {
  return (
    <>
      <dt className={formMutedClassName}>{label}</dt>
      <dd className="min-w-0 font-medium text-zinc-900 dark:text-zinc-50">
        {value}
      </dd>
    </>
  );
}

export function CardFields({ children, className }: CardFieldsProps) {
  return (
    <dl
      className={cn(
        "mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5 text-sm",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function CardList({ children, className }: CardListProps) {
  return <ul className={cn("flex flex-col gap-3", className)}>{children}</ul>;
}
