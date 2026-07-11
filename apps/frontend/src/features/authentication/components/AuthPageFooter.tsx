'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { getAppVersionLabel } from '@/lib/app-version';
import { cn } from '@/utils/cn';

export interface AuthPageFooterProps {
  className?: string;
}

export function AuthPageFooter({ className }: AuthPageFooterProps) {
  const versionLabel = getAppVersionLabel();

  return (
    <footer
      className={cn(
        'flex flex-wrap items-center justify-between gap-wilms-3 text-small text-text-muted',
        className,
      )}
    >
      <ThemeToggle />

      <nav aria-label="Support links" className="flex flex-wrap items-center gap-x-wilms-3 gap-y-wilms-1">
        <Link href="/forgot-password" className="font-semibold text-text-secondary hover:text-brand-primary">
          Help
        </Link>
        <span aria-hidden="true" className="text-border">
          ·
        </span>
        <span className="text-text-muted">Privacy protected</span>
      </nav>

      {versionLabel ? (
        <p className="w-full text-center text-xs text-text-muted sm:ml-auto sm:w-auto sm:text-right">
          {versionLabel}
        </p>
      ) : null}
    </footer>
  );
}
