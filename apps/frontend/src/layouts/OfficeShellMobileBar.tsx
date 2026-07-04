'use client';

import Link from 'next/link';
import { ShellNavbarActions } from '@/components/layout/shell/navbar/ShellNavbarActions';
import { useAuth } from '@/hooks/useAuth';
import { resolveSettingsHref } from '@/utils/settings-route';
import { cn } from '@/utils/cn';
import { Settings } from 'lucide-react';

export interface OfficeShellMobileBarProps {
  brandTitle?: string;
  isExecutive?: boolean;
}

export function OfficeShellMobileBar({
  brandTitle = 'WILMS',
  isExecutive = false,
}: OfficeShellMobileBarProps) {
  const { user } = useAuth();
  const settingsHref = resolveSettingsHref(user?.role);

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

        <div className="flex shrink-0 items-center gap-1">
          {user ? (
            <Link
              href={settingsHref}
              aria-label="Settings"
              className="inline-flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-text-muted transition-colors hover:bg-background hover:text-text-primary"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : null}
          <ShellNavbarActions compact showDateTime={false} mobileSimplified />
        </div>
      </div>
    </header>
  );
}
