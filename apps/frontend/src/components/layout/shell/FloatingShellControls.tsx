'use client';

import { HelpFabButton, HelpMenuModal } from '@/components/onboarding/HelpFab';
import {
  FloatingActionSlot,
  FloatingActionStack,
} from '@/components/layout/shell/FloatingActionStack';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global shell chrome: Quick Help FAB on every authenticated dashboard/workspace,
 * plus the help menu modal used by the product tour.
 *
 * Positioned via FloatingActionStack so it never overlaps the mobile nav drawer
 * trigger region or a bottom navigation bar.
 */
export function FloatingShellControls() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <FloatingActionStack className="print:hidden">
        <FloatingActionSlot>
          <HelpFabButton />
        </FloatingActionSlot>
      </FloatingActionStack>
      <HelpMenuModal />
    </>
  );
}
