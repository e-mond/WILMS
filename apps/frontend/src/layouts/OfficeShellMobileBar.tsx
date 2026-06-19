'use client';

import { ShellNavbarActions } from '@/components/layout/shell/navbar/ShellNavbarActions';
import { cn } from '@/utils/cn';

export interface OfficeShellMobileBarProps {
  brandTitle?: string;
  isExecutive?: boolean;
}

export function OfficeShellMobileBar({
  brandTitle = 'WILMS',
  isExecutive = false,
}: OfficeShellMobileBarProps) {
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
          <div
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-primary"
          >
            <span className="text-lg font-bold leading-none tracking-tighter text-white">W</span>
          </div>

          <p
            className={cn(
              'truncate text-sm font-semibold tracking-tight',
              isExecutive ? 'text-executive-gold' : 'text-brand-primary',
            )}
          >
            {brandTitle}
          </p>
        </div>

        <ShellNavbarActions compact showDateTime={false} mobileSimplified />
      </div>
    </header>
  );
}
