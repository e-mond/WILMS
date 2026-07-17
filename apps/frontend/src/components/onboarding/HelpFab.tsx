'use client';

import { useCallback, useState } from 'react';
import { HelpCircle, Map, BookOpen, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';
import { USER_ROLE } from '@/constants/roles';
import { cn } from '@/utils/cn';

export function HelpFab() {
  const { isAuthenticated, user } = useAuth();
  const replayTour = useReplayProductTour();
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  if (!isAuthenticated) {
    return null;
  }

  const rolesGuideHref =
    user?.role === USER_ROLE.SUPER_ADMIN ? '/settings?section=roles' : '/settings';

  return (
    <>
      <button
        type="button"
        aria-label="Help"
        className={cn(
          'fixed bottom-wilms-5 right-wilms-5 z-[90] inline-flex h-12 w-12 items-center justify-center rounded-full',
          'border border-border bg-card text-brand-primary shadow-lg transition hover:bg-background',
          'motion-safe:hover:scale-105 motion-safe:active:scale-95',
        )}
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-5 w-5" aria-hidden="true" />
      </button>

      <Modal isOpen={open} onClose={close} title="Help">
        <div className="space-y-wilms-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-wilms-2"
            onClick={() => {
              close();
              replayTour();
            }}
          >
            <Map className="h-4 w-4" aria-hidden="true" />
            Restart Tour
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-wilms-2"
            onClick={() => {
              close();
              window.open(rolesGuideHref, '_self');
            }}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            View Role Guide
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-wilms-2"
            onClick={() => {
              close();
              replayTour();
            }}
          >
            <PlayCircle className="h-4 w-4" aria-hidden="true" />
            Watch Quick Walkthrough
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-wilms-2"
            onClick={() => {
              close();
              window.open('/settings', '_self');
            }}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            Open Settings Help
          </Button>
        </div>
      </Modal>
    </>
  );
}
