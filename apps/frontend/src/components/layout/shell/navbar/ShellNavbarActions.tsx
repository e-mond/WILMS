'use client';

import Link from 'next/link';
import { AppLockNavbarButton } from '@/components/layout/shell/navbar/AppLockNavbarButton';
import { GlobalSearchTrigger } from '@/components/layout/shell/navbar/GlobalSearchPanel';
import { NotificationInboxTrigger } from '@/components/layout/shell/navbar/NotificationInboxPanel';
import { ShellMobileOverflowMenu } from '@/components/layout/shell/navbar/ShellMobileOverflowMenu';
import { UserProfileMenu } from '@/components/layout/shell/navbar/UserProfileMenu';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { useAuth } from '@/hooks/useAuth';
import { resolveSettingsHref } from '@/utils/settings-route';
import { Settings } from 'lucide-react';

export interface ShellNavbarActionsProps {
  showDateTime?: boolean;
  compact?: boolean;
  hideSearch?: boolean;
  mobileSimplified?: boolean;
}

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

export function ShellNavbarActions({
  showDateTime = true,
  compact = false,
  hideSearch = false,
  mobileSimplified = false,
}: ShellNavbarActionsProps) {
  const { user } = useAuth();
  const settingsHref = resolveSettingsHref(user?.role);

  if (mobileSimplified) {
    return (
      <div className="flex shrink-0 flex-nowrap items-center gap-1">
        {user ? (
          <PermissionGate
            permissions={[
              PERMISSION.VIEW_REPORTS,
              PERMISSION.ACCESS_APPROVER_PORTAL,
              PERMISSION.ACCESS_AUDITOR_PORTAL,
              PERMISSION.ACCESS_COLLECTOR_PORTAL,
            ]}
          >
            <NotificationInboxTrigger />
          </PermissionGate>
        ) : null}
        {user ? <UserProfileMenu compact /> : null}
        {user ? <ShellMobileOverflowMenu /> : null}
      </div>
    );
  }

  return (
    <>
      <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-1 sm:gap-1.5 lg:gap-3">
        {user && !hideSearch && !compact ? <GlobalSearchTrigger variant="desktop" /> : null}
        {user && !hideSearch && compact ? <GlobalSearchTrigger /> : null}
        {user ? (
          <PermissionGate
            permissions={[
              PERMISSION.VIEW_REPORTS,
              PERMISSION.ACCESS_APPROVER_PORTAL,
              PERMISSION.ACCESS_AUDITOR_PORTAL,
              PERMISSION.ACCESS_COLLECTOR_PORTAL,
            ]}
          >
            <NotificationInboxTrigger />
          </PermissionGate>
        ) : null}
        {!compact ? (
          <Link
            href={settingsHref}
            aria-label="Settings"
            className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-0 text-text-muted transition-colors hover:bg-background hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
        {!compact ? <AppLockNavbarButton /> : null}
        {showDateTime && !compact ? (
          <p className="hidden text-sm text-text-muted 2xl:block">{formatHeaderDate(new Date())}</p>
        ) : null}
        {!compact ? <ThemeToggle /> : null}
        {user ? <UserProfileMenu compact={compact} /> : null}
      </div>
    </>
  );
}
