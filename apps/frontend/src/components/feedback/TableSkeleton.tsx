import { Skeleton } from '@/components/feedback/Skeleton';

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-4" aria-busy="true">
      <div className="flex gap-3 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-3 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`${rowIndex}-${colIndex}`} className="h-3 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
