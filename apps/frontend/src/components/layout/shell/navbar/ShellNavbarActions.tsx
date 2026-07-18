'use client';

import type { ReactNode } from 'react';
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
import { useUiStore } from '@/state/uiStore';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { resolveSettingsHref } from '@/utils/settings-route';
import { cn } from '@/utils/cn';
import { HelpCircle, Settings } from 'lucide-react';

export interface ShellNavbarActionsProps {
  showDateTime?: boolean;
  compact?: boolean;
  hideSearch?: boolean;
  mobileSimplified?: boolean;
}

function NavbarIconButton({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: ReactNode;
}) {
  const className = cn(
    'inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted',
    'transition-colors hover:bg-background hover:text-text-primary',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
        <span className="sr-only">{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label}>
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function NavbarDivider() {
  return <span aria-hidden="true" className="mx-0.5 hidden h-5 w-px bg-border sm:block" />;
}

export function ShellNavbarActions({
  showDateTime = true,
  compact = false,
  hideSearch = false,
  mobileSimplified = false,
}: ShellNavbarActionsProps) {
  const { user } = useAuth();
  const settingsHref = resolveSettingsHref(user?.role);
  const openHelpMenu = useUiStore((state) => state.openHelpMenu);
  const isSidebarCollapsed = useShellLayoutStore((state) => state.isSidebarCollapsed);
  /** When the sidebar is expanded, keep the identity chip compact so the bar does not overflow. */
  const profileCompact = compact || !isSidebarCollapsed;

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
    <div className="flex min-w-0 shrink-0 flex-nowrap items-center gap-0.5 sm:gap-1">
      {user && !hideSearch && !compact ? <GlobalSearchTrigger variant="desktop" /> : null}
      {user && !hideSearch && compact ? <GlobalSearchTrigger /> : null}

      {!compact ? (
        <>
          <NavbarIconButton label="Help and guided tour" onClick={openHelpMenu}>
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
          </NavbarIconButton>
          <NavbarDivider />
        </>
      ) : null}

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
        <NavbarIconButton label="Settings" href={settingsHref}>
          <Settings className="h-4 w-4" aria-hidden="true" />
        </NavbarIconButton>
      ) : null}

      {!compact ? <AppLockNavbarButton /> : null}

      {showDateTime && !compact ? (
        <p className="hidden text-xs text-text-muted 2xl:block">
          {new Intl.DateTimeFormat('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date())}
        </p>
      ) : null}

      {!compact ? (
        <>
          <NavbarDivider />
          <ThemeToggle />
        </>
      ) : null}

      {user ? (
        <>
          <NavbarDivider />
          <UserProfileMenu compact={profileCompact} />
        </>
      ) : null}
    </div>
  );
}
