import { CardList } from "@/components/Card";

interface AdminTableSkeletonProps {
  columns?: number;
  rows?: number;
}

const pulseClassName =
  "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800";

const skeletonCardClassName =
  "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900";

function AdminCardSkeleton({
  columns,
  rows,
}: Required<Pick<AdminTableSkeletonProps, "columns" | "rows">>) {
  return (
    <CardList className="mt-4 md:hidden">
      {Array.from({ length: rows }, (_, rowIndex) => (
        <li key={`card-${rowIndex}`}>
          <div className={skeletonCardClassName}>
            <div className="flex items-start justify-between gap-3">
              <div className={`h-6 w-32 max-w-[70%] ${pulseClassName}`} />
              <div className={`size-5 shrink-0 ${pulseClassName}`} />
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5">
              {Array.from({ length: columns }, (_, fieldIndex) => (
                <div
                  key={`field-${rowIndex}-${fieldIndex}`}
                  className="contents"
                >
                  <dt>
                    <div className={`h-3.5 w-14 ${pulseClassName}`} />
                  </dt>
                  <dd>
                    <div className={`h-3.5 w-24 max-w-full ${pulseClassName}`} />
                  </dd>
                </div>
              ))}
            </dl>
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
      <AdminCardSkeleton columns={columns} rows={rows} />
      <AdminTableRowsSkeleton columns={columns} rows={rows} />
    </div>
  );
}
