import { CardList } from "@/components/Card";

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
}

const pulseClassName =
  "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800";

const skeletonCardClassName =
  "min-h-[4.75rem] rounded-xl border border-zinc-200 bg-white px-[1.125rem] py-4 dark:border-zinc-700 dark:bg-zinc-900";

function AdminCardSkeleton({
  rows,
}: Required<Pick<AdminTableSkeletonProps, "rows">>) {
  return (
    <CardList className="md:hidden">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <li key={`card-${rowIndex}`}>
          <div className={skeletonCardClassName}>
            <div className="flex items-start justify-between gap-3">
              <div className={`h-5 w-36 max-w-[55%] ${pulseClassName}`} />
              <div className="flex shrink-0 items-center gap-2">
                <div className={`h-6 w-16 rounded-full ${pulseClassName}`} />
                <div className={`size-8 rounded-md ${pulseClassName}`} />
              </div>
            </div>
            <div className={`mt-2 h-3.5 w-44 max-w-[80%] ${pulseClassName}`} />
          </div>
        </li>
      ))}
    </CardList>
  );
}

function AdminTableRowsSkeleton({
  columns,
  rows,
}: Required<Pick<AdminTableSkeletonProps, "columns" | "rows">>) {
  return (
    <div className="mt-4 hidden overflow-x-auto md:block">
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
  );
}

export function AdminTableSkeleton({
  columns = 4,
  rows = 4,
}: AdminTableSkeletonProps) {
  return (
    <div aria-busy="true" aria-live="polite" role="status">
      <span className="sr-only">Loading…</span>
      <AdminCardSkeleton rows={rows} />
      <AdminTableRowsSkeleton columns={columns} rows={rows} />
    </div>
  );
}
