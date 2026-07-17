import { CardSkeleton } from '@/components/feedback/CardSkeleton';
import { Skeleton } from '@/components/feedback/Skeleton';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';

export { TableSkeleton };

export function DashboardPageSkeleton({ 'aria-label': ariaLabel = 'Loading page' }: { 'aria-label'?: string }) {
  return (
    <div className="space-y-wilms-5 p-wilms-4 md:p-wilms-6" aria-busy="true" aria-label={ariaLabel}>
      <div className="space-y-wilms-2">
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-wilms-4 md:grid-cols-2 xl:grid-cols-4">
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}

export function FormPanelSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-wilms-4 rounded-lg border border-border bg-card p-wilms-5" aria-busy="true">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-wilms-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  );
}

export function InlinePanelSkeleton() {
  return (
    <div className="space-y-wilms-3 py-wilms-6" aria-busy="true" aria-label="Loading">
      <Skeleton className="mx-auto h-4 w-40" />
      <Skeleton className="mx-auto h-3 w-56" />
      <Skeleton className="mx-auto h-3 w-48" />
    </div>
  );
}
