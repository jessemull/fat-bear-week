import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface ButtonPendingLabelProps {
  children: ReactNode;
}

export function ButtonPendingLabel({ children }: ButtonPendingLabelProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <Loader2
        aria-hidden="true"
        className="size-4 shrink-0 animate-spin"
        strokeWidth={2}
      />
      {children}
    </span>
  );
}
