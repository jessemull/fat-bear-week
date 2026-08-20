import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Loader2, Plus } from "lucide-react";
import Link from "next/link";

import { ButtonPendingLabel } from "@/components/ButtonPendingLabel";
import {
  adminHeaderPrimaryActionClassName,
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface AdminPageHeaderProps {
  action?: ReactNode;
  children?: ReactNode;
  description: string;
  title: ReactNode;
}

interface AdminPageHeaderActionProps {
  icon?: LucideIcon;
  label: string;
}

interface AdminPageHeaderButtonActionProps extends AdminPageHeaderActionProps {
  disabled?: boolean;
  onClick: () => void;
  pending?: boolean;
  pendingLabel?: string;
  type?: "button" | "submit";
}

interface AdminPageHeaderLinkActionProps extends AdminPageHeaderActionProps {
  href: string;
}

export function AdminPageHeader({
  action,
  children,
  description,
  title,
}: AdminPageHeaderProps) {
  return (
    <div className="relative flex w-full flex-col gap-2">
      <header className="flex w-full flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <h1
            className={`min-w-0 flex-1 truncate text-3xl ${action ? "pr-10 md:pr-0" : ""} ${formHeadingClassName}`}
            title={typeof title === "string" ? title : undefined}
          >
            {title}
          </h1>
          {action ? (
            <div className="absolute top-0 right-0 md:static md:shrink-0">
              {action}
            </div>
          ) : null}
        </div>
        <p className={`text-sm ${formMutedClassName}`}>{description}</p>
      </header>
      {children}
    </div>
  );
}

export function AdminPageHeaderButtonAction({
  disabled,
  icon: Icon = Plus,
  label,
  onClick,
  pending = false,
  pendingLabel,
  type = "button",
}: AdminPageHeaderButtonActionProps) {
  const busyLabel = pendingLabel ?? label;

  return (
    <button
      aria-busy={pending}
      aria-label={pending ? busyLabel : label}
      className={adminHeaderPrimaryActionClassName}
      disabled={disabled || pending}
      type={type}
      onClick={onClick}
    >
      {pending ? (
        <Loader2 aria-hidden className="size-5 animate-spin md:hidden" />
      ) : (
        <Icon aria-hidden className="size-5 md:hidden" />
      )}
      <span className="hidden md:inline">
        {pending ? <ButtonPendingLabel>{busyLabel}</ButtonPendingLabel> : label}
      </span>
    </button>
  );
}

export function AdminPageHeaderLinkAction({
  href,
  icon: Icon = Plus,
  label,
}: AdminPageHeaderLinkActionProps) {
  return (
    <Link
      aria-label={label}
      className={adminHeaderPrimaryActionClassName}
      href={href}
    >
      <Icon aria-hidden className="size-5 md:hidden" />
      <span className="hidden md:inline">{label}</span>
    </Link>
  );
}
