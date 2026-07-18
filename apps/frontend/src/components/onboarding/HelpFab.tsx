'use client';

import { useEffect } from 'react';
import { HelpCircle, Map, BookOpen, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';
import { USER_ROLE } from '@/constants/roles';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';

export function HelpFabButton({ className }: { className?: string }) {
  const openHelpMenu = useUiStore((state) => state.openHelpMenu);

  return (
    <button
      type="button"
      aria-label="Help"
      className={cn(
        'inline-flex h-12 w-12 items-center justify-center rounded-full',
        'border border-border bg-card text-brand-primary shadow-md transition-colors hover:bg-background',
        'motion-safe:transition-transform motion-safe:hover:scale-105 motion-safe:active:scale-95',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        className,
      )}
      onClick={openHelpMenu}
    >
      <HelpCircle className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}

export function HelpMenuModal() {
  const { isAuthenticated, user } = useAuth();
  const replayTour = useReplayProductTour();
  const isOpen = useUiStore((state) => state.isHelpMenuOpen);
  const closeHelpMenu = useUiStore((state) => state.closeHelpMenu);

  useEffect(() => {
    if (!isAuthenticated && isOpen) {
      closeHelpMenu();
    }
  }, [closeHelpMenu, isAuthenticated, isOpen]);

  if (!isAuthenticated) {
    return null;
  }

  const rolesGuideHref =
    user?.role === USER_ROLE.SUPER_ADMIN ? '/settings?section=roles' : '/settings';

  return (
    <Modal isOpen={isOpen} onClose={closeHelpMenu} title="Help">
      <div className="space-y-wilms-3">
        <p className="text-small text-text-muted">
          Restart the guided tour anytime from here or from the help icon in the header.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-wilms-2"
          onClick={() => {
            closeHelpMenu();
            replayTour();
          }}
        >
          <Map className="h-4 w-4" aria-hidden="true" />
          Restart guided tour
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-wilms-2"
          onClick={() => {
            closeHelpMenu();
            window.open(rolesGuideHref, '_self');
          }}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          View role guide
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-wilms-2"
          onClick={() => {
            closeHelpMenu();
            replayTour();
          }}
        >
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Quick walkthrough
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-wilms-2"
          onClick={() => {
            closeHelpMenu();
            window.open('/settings', '_self');
          }}
        >
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          Open settings help
        </Button>
      </div>
    </Modal>
  );
}

/** @deprecated Prefer FloatingShellControls — kept for compatibility. */
export function HelpFab() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  return (
    <>
      <div className="fixed bottom-wilms-5 right-wilms-5 z-[90]">
        <HelpFabButton />
      </div>
      <HelpMenuModal />
    </>
  );
}
