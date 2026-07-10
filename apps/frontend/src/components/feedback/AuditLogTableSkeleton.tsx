import { Skeleton } from '@/components/feedback/Skeleton';

const COLUMN_WIDTHS = [
  'w-[14%]',
  'w-[18%]',
  'w-[16%]',
  'w-[12%]',
  'w-[18%]',
  'w-[22%]',
] as const;

const COLUMN_HEADERS = ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Reason'];

export function AuditLogTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-wilms-4" aria-busy="true" aria-label="Loading audit log">
      <div className="grid gap-wilms-4 sm:grid-cols-2">
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-wilms-2 h-8 w-16" />
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-wilms-2 h-8 w-24" />
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card p-wilms-4">
        <div className="grid gap-wilms-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={`filter-${index}`} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-sm border border-border bg-card">
        <table className="min-w-full table-fixed border-collapse text-left text-body">
          <caption className="sr-only">Loading audit log entries</caption>
          <thead className="border-b border-border bg-card">
            <tr>
              {COLUMN_HEADERS.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`px-wilms-4 py-wilms-3 text-small font-semibold uppercase tracking-wide text-text-muted ${COLUMN_WIDTHS[index]}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border last:border-b-0">
                {COLUMN_WIDTHS.map((width, colIndex) => (
                  <td key={`${rowIndex}-${colIndex}`} className={`px-wilms-4 py-wilms-3 ${width}`}>
                    {colIndex === 1 ? (
                      <div className="flex items-center gap-wilms-2">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                        <Skeleton className="h-3 flex-1" />
                      </div>
                    ) : (
                      <Skeleton className="h-3 w-full max-w-[12rem]" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
