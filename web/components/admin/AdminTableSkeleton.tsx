interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
}

const pulseClassName =
  "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800";

export function AdminTableSkeleton({
  columns = 3,
  rows = 5,
}: AdminTableSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-2"
      role="status"
    >
      <span className="sr-only">Loading…</span>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className={`h-9 w-48 max-w-full ${pulseClassName}`} />
          <div className={`h-4 w-72 max-w-full ${pulseClassName}`} />
        </div>
        <div className={`h-8 w-28 shrink-0 ${pulseClassName}`} />
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-full">
          <div className="flex gap-4 border-b border-zinc-200 py-2 dark:border-zinc-700">
            {Array.from({ length: columns }, (_, index) => (
              <div
                key={`header-${index}`}
                className={`h-4 flex-1 ${pulseClassName}`}
              />
            ))}
          </div>
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="flex gap-4 border-b border-zinc-200 py-3 dark:border-zinc-800"
            >
              {Array.from({ length: columns }, (_, columnIndex) => (
                <div
                  key={`cell-${rowIndex}-${columnIndex}`}
                  className={`h-4 flex-1 ${pulseClassName}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
