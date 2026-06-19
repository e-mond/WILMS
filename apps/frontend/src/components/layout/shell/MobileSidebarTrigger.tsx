'use client';

import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';
import { PanelLeft, X } from 'lucide-react';

export interface MobileSidebarTriggerProps {
  className?: string;
}

export function MobileSidebarTrigger({ className }: MobileSidebarTriggerProps) {
  const { isMobileNavOpen, toggleMobileNav } = useUiStore();

  return (
    <button
      type="button"
      onClick={toggleMobileNav}
      aria-expanded={isMobileNavOpen}
      aria-label={isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
      className={cn(
        'fixed left-0 top-1/2 z-[60] flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center',
        'rounded-r-full border border-l-0 border-border bg-card/95 text-text-primary shadow-md backdrop-blur-sm',
        'transition-colors hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        'md:hidden',
        className,
      )}
    >
      {isMobileNavOpen ? (
        <X className="h-5 w-5" aria-hidden="true" />
      ) : (
        <PanelLeft className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
