'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const breadcrumbs = resolveShellBreadcrumbs(pathname, searchParams.toString());
  const openMobileNav = useUiStore((state) => state.openMobileNav);
  const isSidebarCollapsed = useShellLayoutStore((state) => state.isSidebarCollapsed);
  const { user } = useAuth();
  const [elevated, setElevated] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setElevated(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isExecutive = variant === 'executive';
  const pageTitle =
    breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]?.label : 'Overview';

  return (
    <header
      data-navbar="app"
      data-sidebar-collapsed={isSidebarCollapsed ? 'true' : 'false'}
      data-elevated={elevated ? 'true' : 'false'}
      className={cn(
        'sticky top-0 z-30 hidden border-b border-border/70 bg-card/95 px-3 backdrop-blur-xl md:block lg:px-5',
        'supports-[backdrop-filter]:bg-card/85',
        'motion-safe:transition-[box-shadow,background-color] motion-safe:duration-[var(--motion-base)]',
        elevated && 'navbar-elevated',
        className,
      )}
    >
      <div className="flex h-14 w-full min-w-0 items-center gap-3 lg:gap-4">
        <div className="flex min-w-0 flex-[1_1_12rem] items-center gap-2.5 overflow-hidden">
          {showMobileNavTrigger ? (
            <button
              type="button"
              onClick={openMobileNav}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background/70 text-text-primary transition-colors hover:border-brand-primary/30 hover:bg-brand-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          <div className="min-w-0 flex-1 overflow-hidden rounded-xl px-1 py-1">
            {isExecutive ? (
              <PageBreadcrumbs items={breadcrumbs} />
            ) : (
              <h1 className="truncate text-base font-semibold tracking-tight text-text-primary">
                {pageTitle}
              </h1>
            )}
          </div>
        </div>

        <div className="hidden min-w-0 flex-[1_1_16rem] max-w-lg md:block">
          {user ? <GlobalSearchTrigger variant="desktop" className="w-full max-w-full" /> : null}
        </div>

        <div className="flex shrink-0 items-center justify-end">
          <div className="inline-flex items-center gap-0.5 rounded-2xl border border-border/70 bg-background/60 p-1 shadow-xs dark:bg-white/[0.03]">
            <ShellNavbarActions hideSearch showDateTime />
          </div>
        </div>
      </div>
    </header>
  );
}
