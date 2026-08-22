import type { HTMLAttributes } from "react";

import { getDisplayInitials } from "@/lib/account";
import { cn } from "@/lib/cn";

interface AccountInitialsProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: "md" | "sm";
}

const sizeClassName = {
  md: "size-12 text-lg",
  sm: "size-8 text-sm",
} as const;

export function AccountInitials({
  className,
  name,
  size = "sm",
  ...rest
}: AccountInitialsProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-amber-700 font-semibold text-white dark:bg-amber-600",
        sizeClassName[size],
        className,
      )}
      {...rest}
    >
      {getDisplayInitials(name)}
    </span>
  );
}
