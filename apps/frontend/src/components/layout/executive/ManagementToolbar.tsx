import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ManagementToolbarProps {
  search?: ReactNode;
  secondaryFilters?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ManagementToolbar({
  search,
  secondaryFilters,
  filters,
  actions,
  className,
}: ManagementToolbarProps) {
  const hasPrimaryRow = Boolean(search || secondaryFilters);

  return (
    <div
      className={cn(
        'space-y-wilms-3 border-b border-border/80 pb-wilms-3',
        className,
      )}
    >
      {hasPrimaryRow ? (
        <div className="grid min-w-0 gap-wilms-2 md:grid-cols-2 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          {search ? <div className="min-w-0">{search}</div> : null}
          {secondaryFilters ? <div className="min-w-0">{secondaryFilters}</div> : null}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-wilms-2 lg:flex-row lg:items-end lg:justify-between">
        {filters ? <div className="min-w-0 flex-1">{filters}</div> : hasPrimaryRow ? null : <div className="flex-1" />}
        {actions ? (
          <div className="flex w-full shrink-0 flex-wrap items-center justify-start gap-wilms-2 sm:justify-end lg:w-auto [&_button]:min-h-[44px] sm:[&_button]:min-h-8 lg:[&_a]:min-h-[44px] lg:[&_a]:inline-flex lg:[&_a]:items-center">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
