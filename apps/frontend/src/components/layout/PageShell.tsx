import type { ReactNode } from 'react';
import { PageBreadcrumbs, type PageBreadcrumbsProps } from '@/components/layout/PageBreadcrumbs';
import { cn } from '@/utils/cn';

export interface PageShellProps {
  description?: string;
  breadcrumbs?: PageBreadcrumbsProps['items'];
  actions?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'executive';
  className?: string;
}

export function PageShell({
  description,
  breadcrumbs,
  actions,
  children,
  variant = 'default',
  className,
}: PageShellProps) {
  const isExecutive = variant === 'executive';

  return (
    <div
      className={cn(
        'space-y-wilms-6 p-wilms-4 md:p-wilms-6',
        isExecutive && 'space-y-wilms-4',
        className,
      )}
    >
      {!isExecutive && breadcrumbs?.length ? <PageBreadcrumbs items={breadcrumbs} /> : null}
      {!isExecutive && description ? (
        <p className="max-w-3xl text-body text-text-muted">{description}</p>
      ) : null}
      {actions ? <div className="flex justify-end">{actions}</div> : null}
      {children}
    </div>
  );
}
