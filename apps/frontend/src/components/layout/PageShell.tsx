'use client';

import type { ReactNode } from 'react';
import { PageBreadcrumbs, type PageBreadcrumbsProps } from '@/components/layout/PageBreadcrumbs';
import { useShellPageDescription } from '@/hooks/useShellPageDescription';
import { cn } from '@/utils/cn';

export interface PageShellProps {
  description?: string;
  breadcrumbs?: PageBreadcrumbsProps['items'];
  actions?: ReactNode;
  children: ReactNode;
  variant?: 'default' | 'executive';
  className?: string;
  showAutoDescription?: boolean;
}

export function PageShell({
  description,
  breadcrumbs,
  actions,
  children,
  variant = 'default',
  className,
  showAutoDescription = true,
}: PageShellProps) {
  const autoDescription = useShellPageDescription();
  const isExecutive = variant === 'executive';
  const resolvedDescription =
    description ?? (showAutoDescription ? autoDescription : undefined);

  return (
    <div
      className={cn(
        'space-y-wilms-6 p-wilms-4 md:p-wilms-6',
        isExecutive && 'space-y-wilms-4',
        className,
      )}
    >
      {!isExecutive && breadcrumbs?.length ? <PageBreadcrumbs items={breadcrumbs} /> : null}
      {resolvedDescription ? (
        <p className="max-w-3xl text-body text-text-muted">{resolvedDescription}</p>
      ) : null}
      {actions ? <div className="flex justify-end">{actions}</div> : null}
      {children}
    </div>
  );
}
