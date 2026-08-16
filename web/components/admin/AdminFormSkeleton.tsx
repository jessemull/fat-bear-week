interface AdminFormSkeletonProps {
  fields?: number;
}

const pulseClassName =
  "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800";

export function AdminFormSkeleton({ fields = 4 }: AdminFormSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex w-full max-w-lg flex-col gap-4"
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
      <div className="mt-2 grid w-full grid-cols-2 gap-2">
        <div className={`h-8 w-full ${pulseClassName}`} />
        <div className={`h-8 w-full ${pulseClassName}`} />
      </div>
    </div>
  );
}
