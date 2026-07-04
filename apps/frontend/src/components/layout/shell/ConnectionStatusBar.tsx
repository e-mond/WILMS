'use client';

import { ConnectionStatusChip } from '@/components/layout/shell/navbar/ConnectionStatusChip';
import { cn } from '@/utils/cn';

export function ConnectionStatusBar() {
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50',
        'right-3 sm:right-4',
        'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:bottom-4',
      )}
      aria-hidden={false}
    >
      <div
        className={cn(
          'pointer-events-auto rounded-full border border-border bg-background/95 shadow-lg backdrop-blur-md',
          'sm:rounded-sm',
        )}
      >
        <ConnectionStatusChip />
      </div>
    </div>
  );
}
