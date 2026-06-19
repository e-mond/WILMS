import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-sm border border-border bg-card p-wilms-8 text-center',
        className,
      )}
    >
      <h2 className="text-heading-2 font-semibold text-text-primary">{title}</h2>
      {description ? (
        <p className="mt-wilms-2 max-w-md text-body text-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-wilms-4">{action}</div> : null}
    </div>
  );
}
