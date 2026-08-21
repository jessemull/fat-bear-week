import type { LucideIcon } from "lucide-react";

import {
  appCenteredPagePaddingClassName,
  formHeadingClassName,
  formMutedClassName,
} from "@/lib/form-styles";

interface PageStatusProps {
  description: string;
  icon: LucideIcon;
  iconTone?: "amber" | "danger";
  title: string;
}

const iconToneClassName = {
  amber: "text-amber-600 dark:text-amber-500",
  danger: "text-red-600/80 dark:text-red-600/80",
} as const;

export function PageStatus({
  description,
  icon: Icon,
  iconTone = "danger",
  title,
}: PageStatusProps) {
  return (
    <main
      className={`flex flex-1 flex-col items-center justify-center ${appCenteredPagePaddingClassName} text-center`}
    >
      <div className="flex max-w-sm flex-col items-center gap-3">
        <Icon
          aria-hidden="true"
          className={`size-24 ${iconToneClassName[iconTone]}`}
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
