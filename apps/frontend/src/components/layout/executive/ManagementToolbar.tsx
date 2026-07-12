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
  return (
    <div
      className={cn(
        'flex flex-col gap-wilms-3 border-b border-border/80 pb-wilms-3',
        className,
      )}
    >
      <div className="flex flex-col gap-wilms-2 lg:flex-row lg:items-center lg:justify-between lg:gap-wilms-4">
        {search || secondaryFilters ? (
          <div className="flex min-w-0 flex-1 flex-col gap-wilms-2 sm:flex-row sm:items-center sm:gap-wilms-3">
            {search ? <div className="w-full shrink-0 sm:max-w-xs lg:w-72">{search}</div> : null}
            {secondaryFilters ? <div className="shrink-0">{secondaryFilters}</div> : null}
          </div>
        ) : (
          <div className="flex-1" />
        )}
        {actions ? (
          <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-wilms-2 [&_button]:min-h-[44px] sm:[&_button]:min-h-8 lg:[&_a]:min-h-[44px] lg:[&_a]:inline-flex lg:[&_a]:items-center">
            {actions}
          </div>
        ) : null}
      </div>
      {filters ? <div className="min-w-0">{filters}</div> : null}
    </div>
  );
}
