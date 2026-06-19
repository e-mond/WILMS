import { cn } from '@/utils/cn';

export interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  label = 'Loading',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={cn('inline-flex items-center gap-wilms-2', className)}
    >
      <span
        aria-hidden="true"
        className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand-primary"
      />
      <span className="text-small text-text-muted">{label}</span>
    </div>
  );
}
