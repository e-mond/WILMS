'use client';

import { usePathname } from 'next/navigation';
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs';
import {
  GlobalSearchTrigger,
} from '@/components/layout/shell/navbar/GlobalSearchPanel';
import { ShellNavbarActions } from '@/components/layout/shell/navbar/ShellNavbarActions';
import type { ShellProfile } from '@/constants/shell-profiles';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
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
  const { user } = useAuth();

  const isExecutive = variant === 'executive';

  return (
    <header
      data-navbar="app"
      className={cn(
        'hidden border-b border-border bg-card px-4 py-3 md:block lg:px-6',
        className,
      )}
    >
      <div className="grid h-11 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {showMobileNavTrigger ? (
            <button
              onClick={openMobileNav}
              className="flex h-11 w-11 items-center justify-center rounded-md text-text-primary hover:bg-accent md:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          {isExecutive ? (
            <PageBreadcrumbs items={breadcrumbs} />
          ) : (
            <h1 className="truncate text-xl font-semibold tracking-tight text-text-primary">
              {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1]?.label : 'Overview'}
            </h1>
          )}
        </div>

        <div className="hidden justify-self-center md:block">{user ? <GlobalSearchTrigger variant="desktop" /> : null}</div>

        <div className="flex min-w-0 justify-self-end">
          <ShellNavbarActions hideSearch />
        </div>
      </div>
    </header>
  );
}
