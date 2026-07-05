import { EmptyState } from '@/components/feedback/EmptyState';
import { Button } from '@/components/ui/Button';
import { resolveQueryErrorPresentation } from '@/utils/query-error-presentation';

export interface QueryErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
  title?: string;
  description?: string;
}

export function QueryErrorState({ error, onRetry, title, description }: QueryErrorStateProps) {
  const presentation = error ? resolveQueryErrorPresentation(error) : null;

  return (
    <EmptyState
      title={title ?? presentation?.title ?? 'Unable to load this data'}
      description={description ?? presentation?.description ?? 'Please try again.'}
      action={
        onRetry && (presentation?.canRetry ?? true) ? (
          <Button type="button" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    />
  );
}
