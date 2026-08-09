'use client';

import { HelpMenuModal } from '@/components/onboarding/HelpFab';

/**
 * Shell chrome for optional help menu (opened from product tour / uiStore).
 * Connection status and Help FAB are intentionally not permanently mounted.
 */
export function FloatingShellControls() {
  return <HelpMenuModal />;
}
