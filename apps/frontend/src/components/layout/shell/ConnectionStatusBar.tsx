'use client';

import { ConnectionStatusChip } from '@/components/layout/shell/navbar/ConnectionStatusChip';
import { cn } from '@/utils/cn';

export function ConnectionStatusBar() {
  return (
    <div
      className={cn(
        'pointer-events-none fixed z-40',
        'bottom-4 right-4 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2',
      )}
    >
      <div className="pointer-events-auto rounded-sm border border-border bg-background/95 shadow-md backdrop-blur-sm">
        <ConnectionStatusChip />
      </div>
    </div>
  );
}
