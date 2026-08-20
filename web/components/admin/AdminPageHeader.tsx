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
    <header className="@container grid w-full grid-cols-1 gap-2 @min-[512px]:grid-cols-[minmax(0,1fr)_auto] @min-[512px]:items-start @min-[512px]:gap-x-4">
      <h1 className={`min-w-0 text-3xl ${formHeadingClassName}`}>{title}</h1>
      <p
        className={`text-sm @min-[512px]:col-start-1 @min-[512px]:row-start-2 ${formMutedClassName}`}
      >
        {description}
      </p>
      {action ? (
        <div className="w-full @min-[512px]:col-start-2 @min-[512px]:row-start-1 @min-[512px]:w-auto @min-[512px]:shrink-0 @min-[512px]:pt-1 [&>a]:flex [&>a]:w-full [&>button]:flex [&>button]:w-full @min-[512px]:[&>a]:w-auto @min-[512px]:[&>button]:w-auto">
          {action}
        </div>
      ) : null}
      {children ? <div className="@min-[512px]:col-span-2">{children}</div> : null}
    </header>
  );
}
