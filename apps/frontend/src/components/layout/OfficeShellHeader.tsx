'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { NotificationInboxTrigger } from '@/components/layout/shell/navbar/NotificationInboxPanel';
import { useAuth } from '@/hooks/useAuth';
import { useShellPageTitle } from '@/hooks/useShellPageTitle';
import { resolveShellBreadcrumbs } from '@/utils/shell-breadcrumbs';

function formatHeaderDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export interface OfficeShellHeaderProps {
  roleLabel: string;
  variant?: 'standard' | 'executive';
}

export function OfficeShellHeader({
  roleLabel,
  variant = 'standard',
}: OfficeShellHeaderProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const pageTitle = useShellPageTitle();
  const breadcrumbs = resolveShellBreadcrumbs(pathname);
  const isExecutive = variant === 'executive';
  const now = new Date();

  const initials = (user?.displayName ?? roleLabel).slice(0, 2).toUpperCase();
  const displayName = user?.displayName ?? roleLabel;

  return (
    <header
      /**
       * Sets --navbar-height so the notification drawer and sticky sidebar
       * can offset themselves correctly (see NotificationInboxPanel & ExecutiveDetailLayout).
       */
      style={{ '--navbar-height': '57px' } as React.CSSProperties}
      className="sticky top-0 z-30 h-[57px] border-b border-border bg-card/95 backdrop-blur-sm px-wilms-6"
    >
      <div className="flex h-full items-center justify-between gap-wilms-4">

        {/* Left: title / breadcrumbs + live badge */}
        <div className="flex min-w-0 items-center gap-wilms-3">
          {isExecutive ? (
            <PageBreadcrumbs items={breadcrumbs} />
          ) : (
            <h1 className="truncate text-heading-1 font-bold text-text-primary">{pageTitle}</h1>
          )}

        </div>

        {/* Right: date · theme · notifications · user */}
        <div className="flex shrink-0 items-center gap-wilms-3">
          {/* Date — hidden on small screens */}
          <p className="hidden text-small text-text-muted lg:block">
            {formatHeaderDate(now)}
          </p>

          <div className="h-5 w-px bg-border hidden lg:block" aria-hidden="true" />

          <ThemeToggle />
          <NotificationInboxTrigger />

          {/* Divider */}
          <div className="h-5 w-px bg-border" aria-hidden="true" />

          {/* User identity */}
          <div className="flex items-center gap-wilms-2">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-primary/40 bg-brand-primary-light text-small font-bold text-brand-primary"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-body font-semibold text-text-primary leading-tight">{displayName}</p>
              <p className="text-small text-text-muted leading-tight">{roleLabel}</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}