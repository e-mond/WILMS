'use client';

import { ShellNavbarActions } from '@/components/layout/shell/navbar/ShellNavbarActions';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';
import { Menu } from 'lucide-react';

export interface OfficeShellMobileBarProps {
  brandTitle?: string;
  isExecutive?: boolean;
  /** When true, show the menu control that opens the mobile nav drawer. */
  showNavTrigger?: boolean;
}

export function OfficeShellMobileBar({
  brandTitle = 'WILMS',
  isExecutive = false,
  showNavTrigger = false,
}: OfficeShellMobileBarProps) {
  const openMobileNav = useUiStore((state) => state.openMobileNav);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 md:hidden',
        'border-b border-border/40',
        'bg-card/95 backdrop-blur-xl',
        'px-4 py-3',
        'pt-[max(12px,env(safe-area-inset-top))]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {showNavTrigger ? (
            <button
              type="button"
              onClick={openMobileNav}
              className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}

          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary"
          >
            <span className="text-lg font-bold leading-none tracking-tighter text-white">W</span>
          </div>

          <p
            className={cn(
              'min-w-0 truncate text-sm font-semibold tracking-tight',
              isExecutive ? 'text-executive-gold' : 'text-brand-primary',
            )}
          >
            {brandTitle}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <ShellNavbarActions compact showDateTime={false} mobileSimplified />
        </div>
      </div>
    </header>
  );
}
