'use client';

import { HelpFabButton, HelpMenuModal } from '@/components/onboarding/HelpFab';
import { useAuth } from '@/hooks/useAuth';

/**
 * Global shell chrome: Quick Help FAB on every authenticated dashboard/workspace,
 * plus the help menu modal used by the product tour.
 */
export function FloatingShellControls() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-wilms-5 right-wilms-5 z-[90] print:hidden">
        <HelpFabButton />
      </div>
      <HelpMenuModal />
    </>
  );
}
