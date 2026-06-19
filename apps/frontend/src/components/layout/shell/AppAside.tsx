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
        maxHeight: `calc(100vh - ${SHELL_NAVBAR_HEIGHT} - ${SHELL_FOOTER_HEIGHT})`,
      }}
      className={cn(
        'sticky top-0 hidden shrink-0 self-start overflow-y-auto border-l border-border bg-card xl:block',
        className,
      )}
    >
      <div className="space-y-wilms-4 p-wilms-4">{asideContent}</div>
    </aside>
  );
}

export function AppAsidePlaceholder() {
  return (
    <p className="text-body text-text-muted">
      Select a record in the main table to view contextual details here.
    </p>
  );
}
