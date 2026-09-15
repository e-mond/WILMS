'use client';

import type { ReactNode } from 'react';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { WilmsBrandMark } from '@/components/icons/WilmsBrandMark';
import { useAuth } from '@/hooks/useAuth';
import { getRoleLabel } from '@/utils/role-label';
import type { ShellNavItem } from '@/constants/navigation';
import { ShellNavigation } from '@/layouts/ShellNavigation';
import type { ShellNavVariant } from '@/layouts/ShellNavLink';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { cn } from '@/utils/cn';
import { getAppVersionLabel } from '@/lib/app-version';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export interface AppSidebarProps {
  navItems: ShellNavItem[];
  navAriaLabel: string;
  navVariant?: ShellNavVariant;
  isExecutive?: boolean;
  brandTitle?: string;
  versionLabel?: string;
  footer?: ReactNode;
  /**
   * Force expanded labels (mobile drawer). Ignores the desktop collapsed preference
   * so a collapsed desktop sidebar does not render as icon-only inside the drawer.
   */
  forceExpanded?: boolean;
}

export function AppSidebar({
  navItems,
  navAriaLabel,
  navVariant = 'executive',
  isExecutive = true,
  brandTitle,
  versionLabel = getAppVersionLabel() || undefined,
  footer,
  forceExpanded = false,
}: AppSidebarProps) {
  const { user } = useAuth();
  const persistedCollapsed = useShellLayoutStore((state) => state.isSidebarCollapsed);
  const toggleSidebarCollapsed = useShellLayoutStore((state) => state.toggleSidebarCollapsed);
  const isSidebarCollapsed = forceExpanded ? false : persistedCollapsed;
  const roleLabel = getRoleLabel(user?.role).toUpperCase();

  return (
    <div
      className="flex h-full flex-col overflow-hidden bg-inherit"
      data-testid="app-sidebar"
      data-collapsed={isSidebarCollapsed ? 'true' : 'false'}
    >
      <div
        className={cn(
          'relative shrink-0 border-b border-border/70',
          'bg-gradient-to-br from-brand-primary/[0.08] via-transparent to-transparent',
          isSidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3.5',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2',
            isSidebarCollapsed ? 'justify-center' : 'justify-between pr-10',
          )}
        >
          {isExecutive ? (
            <WilmsBrandMark compact={isSidebarCollapsed} roleLabel={roleLabel} />
          ) : (
            <p
              className={cn(
                'min-w-0 truncate font-semibold tracking-wide text-brand-primary',
                isSidebarCollapsed ? 'text-sm' : 'text-body',
              )}
            >
              {brandTitle || 'WILMS'}
            </p>
          )}
        </div>

        {forceExpanded ? null : (
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'absolute top-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-text-muted',
              'transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
              'hidden md:inline-flex',
              isSidebarCollapsed ? 'right-2' : 'right-2.5',
            )}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <div
        className={cn(
          'min-h-0 flex-1 overflow-auto py-3',
          isSidebarCollapsed ? 'px-1.5' : 'px-2.5',
        )}
        data-nav-scroll="true"
      >
        <ShellNavigation
          items={navItems}
          ariaLabel={navAriaLabel}
          variant={navVariant}
          collapsed={isSidebarCollapsed}
          className="w-full"
          linkClassName={isSidebarCollapsed ? 'justify-center px-2' : undefined}
        />
      </div>

      <div className="mt-auto shrink-0 border-t border-border/70 bg-background/40">
        {!isSidebarCollapsed ? (
          <div className="space-y-wilms-3 px-3 py-3.5">
            {footer}
            <LogoutButton collapsed={false} className="rounded-xl" />
            {versionLabel ? (
              <p className="text-center text-[10px] font-medium uppercase tracking-wide text-text-muted">
                {versionLabel}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex justify-center py-3">
            <LogoutButton collapsed={true} className="rounded-xl" />
          </div>
        )}
      </div>
    </div>
  );
}
