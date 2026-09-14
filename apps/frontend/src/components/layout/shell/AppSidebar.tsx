'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
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
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';


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
    <div className="flex h-full flex-col overflow-hidden bg-inherit">
      <div
        className={cn(
          'relative flex shrink-0 items-center border-b border-border px-3 py-4',
          isSidebarCollapsed ? 'justify-center px-2' : 'px-4',
        )}
      >
        <div
          className={cn(
            'flex w-full items-center',
            isSidebarCollapsed ? 'justify-center' : 'justify-start',
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleSidebarCollapsed}
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'absolute top-3 h-9 w-9 shrink-0 p-0 text-text-muted transition-colors hover:bg-background hover:text-text-primary',
              'hidden md:inline-flex',
              isSidebarCollapsed ? 'right-1' : 'right-2',
            )}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-2 py-3" data-nav-scroll="true">
        <ShellNavigation
          items={navItems}
          ariaLabel={navAriaLabel}
          variant={navVariant}
          collapsed={isSidebarCollapsed}
          className="w-full"
          linkClassName={isSidebarCollapsed ? 'justify-center px-2' : undefined}
        />
      </div>

      <div className="mt-auto shrink-0 border-t border-border">
        {!isSidebarCollapsed ? (
          <div className="space-y-wilms-3 px-3 py-3">
            {!forceExpanded ? (
              <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 p-3 shadow-xs dark:border-zinc-800 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
                <div className="flex items-center gap-1.5 text-brand-primary">
                  <span className="text-xs">✦</span>
                  <p className="text-[12px] font-bold text-text-primary">Small steps build big results</p>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                  WILMS v1.8 · Ghana Microfinance Operations
                </p>
                <Link
                  href="/documentation"
                  className="mt-2.5 inline-flex w-full items-center justify-center gap-1 rounded-xl bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 dark:bg-emerald-500 dark:font-bold dark:text-black"
                >
                  <span>Get Started</span>
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : null}
            {footer}
            <LogoutButton collapsed={false} />
            {versionLabel ? (
              <p className="text-center text-[11px] text-text-muted">{versionLabel}</p>
            ) : null}
          </div>
        ) : (
          <div className="flex justify-center py-4">
            <LogoutButton collapsed={true} />
          </div>
        )}
      </div>
    </div>
  );
}
