import type { ReactNode } from "react";

import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface AdminPageHeaderProps {
  action?: ReactNode;
  children?: ReactNode;
  description: string;
  title: ReactNode;
}

export function AdminPageHeader({
  action,
  children,
  description,
  title,
}: AdminPageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-4">
        <h1 className={`min-w-0 text-3xl ${formHeadingClassName}`}>{title}</h1>
        {action ? <div className="shrink-0 pt-1">{action}</div> : null}
      </div>
      <p className={`text-sm ${formMutedClassName}`}>{description}</p>
      {children}
    </header>
  );
}
