import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ManagementToolbarProps {
  search: ReactNode;
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
        'flex flex-col gap-wilms-2 border-b border-border/80 pb-wilms-3',
        'lg:flex-row lg:items-center lg:justify-between lg:gap-wilms-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-wilms-2 sm:flex-row sm:items-center sm:gap-wilms-3 lg:min-w-0 lg:flex-nowrap">
        <div className="w-full shrink-0 sm:max-w-xs lg:w-72">{search}</div>
        {secondaryFilters ? <div className="shrink-0">{secondaryFilters}</div> : null}
        {filters ? (
          <div className="min-w-0 flex-1 overflow-x-auto lg:overflow-visible">{filters}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex min-w-0 shrink-0 flex-col gap-wilms-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end lg:ml-auto lg:w-auto lg:flex-nowrap [&_button]:min-h-[44px] sm:[&_button]:min-h-8 lg:[&_a]:min-h-[44px] lg:[&_a]:inline-flex lg:[&_a]:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
