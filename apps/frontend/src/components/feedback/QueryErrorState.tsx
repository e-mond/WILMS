import Link from 'next/link';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { API_ERROR_CODE, ApiError } from '@/types/api';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';

export interface QueryErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
  description?: string;
  /** When true, show Refresh + Return to Dashboard for network failures. */
  showNavigationActions?: boolean;
  dashboardHref?: string;
}

export function QueryErrorState({
  error,
  onRetry,
  title,
  description,
  showNavigationActions = true,
  dashboardHref = '/dashboard',
}: QueryErrorStateProps) {
  const presentation = error ? resolveQueryErrorPresentation(error) : null;
  const isNetwork =
    error instanceof ApiError &&
    (error.code === API_ERROR_CODE.NETWORK || error.code === API_ERROR_CODE.TIMEOUT);

  return (
    <EmptyState
      title={title ?? presentation?.title ?? 'Unable to load this data'}
      description={description ?? presentation?.description ?? 'Please try again.'}
      action={
        <div className="flex flex-wrap items-center justify-center gap-wilms-2">
          {onRetry && (presentation?.canRetry ?? true) ? (
            <Button type="button" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          {showNavigationActions && isNetwork ? (
            <>
              <Button type="button" variant="secondary" onClick={() => window.location.reload()}>
                Refresh
              </Button>
              <Link
                href={dashboardHref}
                className="inline-flex items-center justify-center rounded-sm bg-brand-primary px-wilms-4 py-wilms-2 text-small font-semibold text-white hover:opacity-90"
              >
                Return to Dashboard
              </Link>
            </>
          ) : null}
        </div>
      }
    />
  );
}
