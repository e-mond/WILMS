'use client';

import { usePathname } from 'next/navigation';
import { ConnectionStatusChip } from '@/components/layout/shell/navbar/ConnectionStatusChip';
import { isPublicPath } from '@/lib/auth/routes';
import { useAppLockStore } from '@/state/appLockStore';
import { cn } from '@/utils/cn';

function shouldHideConnectionBar(pathname: string, isLocked: boolean): boolean {
  if (isPublicPath(pathname)) {
    return true;
  }

  if (isLocked) {
    return true;
  }

  return false;
}

export function ConnectionStatusBar() {
  const pathname = usePathname();
  const isLocked = useAppLockStore((state) => state.isLocked);

  if (shouldHideConnectionBar(pathname, isLocked)) {
    return null;
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-50',
        'right-4 top-1/2 -translate-y-1/2',
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
