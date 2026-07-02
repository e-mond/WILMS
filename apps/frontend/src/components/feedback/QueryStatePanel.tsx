import type { ReactNode } from 'react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { CardSkeleton } from '@/components/feedback/CardSkeleton';
import { TableSkeleton } from '@/components/feedback/TableSkeleton';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { LOADING_TIMEOUT_MESSAGE } from '@/constants/loading-policy';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';

export interface QueryStatePanelProps {
  isLoading: boolean;
  showLoading?: boolean;
  isFetching?: boolean;
  isError: boolean;
  error?: unknown;
  isForbidden?: boolean;
  isTimedOut?: boolean;
  errorMessage?: string;
  errorDescription?: string;
  timeoutMessage?: string;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRetry?: () => void;
  variant?: 'table' | 'cards' | 'inline';
  children: ReactNode;
}

export function QueryStatePanel({
  isLoading,
  showLoading,
  isFetching = false,
  isError,
  error,
  isForbidden = false,
  isTimedOut = false,
  errorMessage,
  errorDescription,
  timeoutMessage = LOADING_TIMEOUT_MESSAGE,
  isEmpty = false,
  emptyTitle = 'No data yet',
  emptyDescription,
  onRetry,
  variant = 'table',
  children,
}: QueryStatePanelProps) {
  const displayLoading = showLoading ?? isLoading;
  const presentation = isError ? resolveQueryErrorPresentation(error) : null;
  const resolvedForbidden = isForbidden || presentation?.variant === 'forbidden';
  const resolvedTitle =
    errorMessage ??
    (resolvedForbidden ? 'Access denied' : presentation?.title ?? 'Unable to load this data');
  const resolvedDescription =
    errorDescription ??
    (resolvedForbidden
      ? presentation?.description ?? 'You do not have permission to view this data.'
      : presentation?.description ?? 'Please try again.');

  if (isTimedOut && (isLoading || isFetching)) {
    return (
      <div className="rounded-lg border border-border bg-background p-6 text-center">
        <p className="text-sm text-text-muted">{timeoutMessage}</p>
        {onRetry ? (
          <Button type="button" variant="secondary" className="mt-4" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (displayLoading) {
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
      <EmptyState
        title={resolvedTitle}
        description={resolvedDescription}
        action={
          onRetry && (presentation?.canRetry ?? !resolvedForbidden) ? (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : null
        }
        className="border-destructive/20 bg-destructive/5"
      />
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
