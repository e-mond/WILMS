import { Skeleton } from '@/components/feedback/Skeleton';

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-3 w-full" />
      ))}
    </div>
  );
}
