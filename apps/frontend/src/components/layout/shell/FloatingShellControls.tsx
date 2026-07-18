'use client';

import { usePathname } from 'next/navigation';
import { HelpFabButton, HelpMenuModal } from '@/components/onboarding/HelpFab';
import {
  FloatingActionSlot,
  FloatingActionStack,
} from '@/components/layout/shell/FloatingActionStack';
import { ConnectionStatusChip } from '@/components/layout/shell/navbar/ConnectionStatusChip';
import { isPublicPath } from '@/lib/auth/routes';
import { useAppLockStore } from '@/state/appLockStore';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

/**
 * Single owner of bottom-right floating chrome (help + connectivity).
 * Aside "Details" trigger remains in ShellAsideDrawer but offsets above this stack on small screens via CSS var.
 */
export function FloatingShellControls() {
  const pathname = usePathname();
  const isLocked = useAppLockStore((state) => state.isLocked);
  const { isAuthenticated } = useAuth();

  const hideConnection = isPublicPath(pathname) || isLocked;
  const showHelp = isAuthenticated && !isPublicPath(pathname) && !isLocked;

  if (hideConnection && !showHelp) {
    return null;
  }

  return (
    <>
      <FloatingActionStack>
        {showHelp ? (
          <FloatingActionSlot>
            <HelpFabButton />
          </FloatingActionSlot>
        ) : null}
        {!hideConnection ? (
          <FloatingActionSlot>
            <div
              className={cn(
                'rounded-full border border-border bg-background/95 shadow-md backdrop-blur-md',
                'sm:rounded-md',
              )}
            >
              <ConnectionStatusChip />
            </div>
          </FloatingActionSlot>
        ) : null}
      </FloatingActionStack>
      {showHelp ? <HelpMenuModal /> : null}
    </>
  );
}
