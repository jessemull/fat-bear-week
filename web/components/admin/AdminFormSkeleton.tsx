import { FormShell } from "@/components/FormShell";
import { formActionsClassName } from "@/lib/form-styles";

interface AdminFormSkeletonProps {
  fields?: number;
}

const pulseClassName =
  "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800";

export function AdminFormSkeleton({ fields = 4 }: AdminFormSkeletonProps) {
  return (
    <FormShell
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <span className="sr-only">Loading…</span>
      <div className="flex flex-col gap-2">
        <div className={`h-9 w-56 max-w-full ${pulseClassName}`} />
        <div className={`h-4 w-80 max-w-full ${pulseClassName}`} />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: fields }, (_, index) => (
          <div key={`field-${index}`} className="flex flex-col gap-2">
            <div className={`h-4 w-24 ${pulseClassName}`} />
            <div className={`h-8 w-full ${pulseClassName}`} />
          </div>
        ))}
      </div>
      <div className={formActionsClassName}>
        <div className={`h-8 w-full ${pulseClassName}`} />
        <div className={`h-8 w-full ${pulseClassName}`} />
      </div>
    </FormShell>
  );
}
