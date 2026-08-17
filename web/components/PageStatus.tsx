import type { LucideIcon } from "lucide-react";

import {
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface PageStatusProps {
  description: string;
  icon: LucideIcon;
  title: string;
}

export function PageStatus({
  description,
  icon: Icon,
  title,
}: PageStatusProps) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 pb-24 text-center">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <Icon
          aria-hidden="true"
          className="size-24 text-red-600/80 dark:text-red-600/80"
          strokeWidth={1.5}
        />
        <h1 className={`text-2xl ${formHeadingClassName}`}>{title}</h1>
        <p className={`max-w-xs text-base ${formMutedClassName}`}>
          {description}
        </p>
      </div>
    </main>
  );
}
