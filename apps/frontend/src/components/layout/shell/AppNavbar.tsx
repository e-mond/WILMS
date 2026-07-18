'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import { GlobalSearchTrigger } from '@/components/layout/shell/navbar/GlobalSearchPanel';
import { ShellNavbarActions } from '@/components/layout/shell/navbar/ShellNavbarActions';
import type { ShellProfile } from '@/constants/shell-profiles';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { resolveShellBreadcrumbs } from '@/utils/shell-breadcrumbs';
import { cn } from '@/utils/cn';
import { Menu } from 'lucide-react';

export interface AppNavbarProps {
  profile?: ShellProfile;
  variant?: 'standard' | 'executive';
  className?: string;
  showMobileNavTrigger?: boolean;
}

export function AppNavbar({
  variant = 'executive',
  className,
  showMobileNavTrigger = true,
}: AppNavbarProps) {
  const pathname = usePathname();
  const breadcrumbs = resolveShellBreadcrumbs(pathname);
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const isSidebarCollapsed = useShellLayoutStore((state) => state.isSidebarCollapsed);
  const { user } = useAuth();

  const isExecutive = variant === 'executive';
  const pageTitle =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]?.label : 'Overview';

  return (
    <header
      data-navbar="app"
      data-sidebar-collapsed={isSidebarCollapsed ? 'true' : 'false'}
      className={cn(
        'sticky top-0 z-30 hidden border-b border-border/80 bg-card/95 px-3 backdrop-blur-sm md:block lg:px-4',
        'supports-[backdrop-filter]:bg-card/90',
        className,
      )}
    >
      {/*
        Use remaining-column flex widths (not viewport vw) so the search field
        does not overflow when the sidebar is expanded.
      */}
      <div className="flex h-12 w-full min-w-0 items-center gap-2 lg:gap-3">
        <div className="flex min-w-0 flex-[1_1_10rem] items-center gap-2 overflow-hidden">
          {showMobileNavTrigger ? (
            <button
              type="button"
              onClick={openMobileNav}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-primary transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 overflow-hidden">
            {isExecutive ? (
              <PageBreadcrumbs items={breadcrumbs} />
            ) : (
              <h1 className="truncate text-base font-semibold tracking-tight text-text-primary">
                {pageTitle}
              </h1>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 flex-[1_1_14rem] max-w-md md:block">
          {user ? <GlobalSearchTrigger variant="desktop" className="w-full max-w-full" /> : null}
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <ShellNavbarActions hideSearch showDateTime={false} />
        </div>
      </div>
    </header>
  );
}
