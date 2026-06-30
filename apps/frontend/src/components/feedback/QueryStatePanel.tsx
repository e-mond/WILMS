import type { ReactNode } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CardSkeleton } from '@/components/feedback/CardSkeleton';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Button } from '@/components/ui/Button';

export interface QueryStatePanelProps {
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  variant?: 'table' | 'cards' | 'inline';
  children: ReactNode;
}

export function QueryStatePanel({
  isLoading,
  isFetching = false,
  isError,
  errorMessage,
  isEmpty = false,
  emptyTitle = 'No data yet',
  emptyDescription,
  onRetry,
  variant = 'table',
  children,
}: QueryStatePanelProps) {
  if (isLoading) {
    if (variant === 'cards') {
      return (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );
    }
    if (variant === 'inline') {
      return (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner label="Loading…" />
        </div>
      );
    }
    return <TableSkeleton />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">{errorMessage ?? 'Unable to load this data.'}</p>
        {onRetry ? (
          <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className={isFetching ? 'opacity-80 transition-opacity' : undefined}>
      {children}
    </div>
  );
}
