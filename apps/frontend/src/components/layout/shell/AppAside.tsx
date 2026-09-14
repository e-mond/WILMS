'use client';

import type { ReactNode } from 'react';
import {
  SHELL_ASIDE_WIDTH,
  SHELL_FOOTER_HEIGHT,
  SHELL_NAVBAR_HEIGHT,
} from '@/constants/shell-layout';
import type { ShellProfile } from '@/constants/shell-profiles';
import { SHELL_PROFILE } from '@/constants/shell-profiles';
import { useAsideContent } from '@/components/layout/shell/AsideSlotContext';
import { cn } from '@/utils/cn';

export interface AppAsideProps {
  profile: ShellProfile;
  fallback?: ReactNode;
  className?: string;
}

export function AppAside({ profile, fallback, className }: AppAsideProps) {
  const content = useAsideContent();
  const asideContent = content ?? fallback;

  if (profile === SHELL_PROFILE.FIELD) {
    return null;
  }

  return (
    <aside
      id="app-aside"
      aria-label="Context panel"
      data-aside="shell"
      tabIndex={0}
      style={{
        width: SHELL_ASIDE_WIDTH,
        height: `calc(100dvh - ${SHELL_NAVBAR_HEIGHT} - ${SHELL_FOOTER_HEIGHT})`,
        top: SHELL_NAVBAR_HEIGHT,
      }}
      className={cn(
        'sticky hidden shrink-0 flex-col border-l border-border bg-card xl:flex',
        className,
      )}
    >
      <div className="flex-1 overflow-y-auto space-y-wilms-4 p-wilms-4">{asideContent}</div>
    </aside>
  );
}

export function AppAsidePlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-border/80 p-wilms-6 text-center text-text-muted">
      <p className="text-small font-semibold text-text-secondary">Context Panel</p>
      <p className="mt-wilms-1 text-small text-text-muted">
        Select a record in the main table to view contextual details here.
      </p>
    </div>
  );
}
