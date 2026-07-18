'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HelpCircle, Map, BookOpen, Keyboard, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useReplayProductTour } from '@/components/onboarding/ProductTourOverlay';
import { USER_ROLE, ROLE_LABELS } from '@/constants/roles';
import { useUiStore } from '@/state/uiStore';
import { resolveSettingsHref } from '@/utils/settings-route';
import { cn } from '@/utils/cn';

type HelpPane = 'menu' | 'role-guide' | 'shortcuts';

function roleGuideCopy(role: string | undefined): { title: string; body: string[] } {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return {
        title: 'Super Admin guide',
        body: [
          'Dashboard shows portfolio KPIs. Operations shows platform health (queues, workers, runtime) — they are different pages.',
          'Use Settings → Users to invite staff, and Settings → Roles to change what each role can do.',
          'Grant a single-user exception under a user’s profile → Permission overrides (does not change the whole role).',
          'Communication Center is for broadcasts (SMS/email/in-app), not 1:1 chat.',
        ],
      };
    case USER_ROLE.COLLECTOR:
      return {
        title: 'Collector guide',
        body: [
          'Record payments from your dashboard or borrower list. GPS may be required before submit.',
          'Work offline — queued payments sync when you are back online (see Sync in Settings).',
          'Reconcile daily collections and submit expenses from the sidebar.',
          'App Lock protects the device when you step away.',
        ],
      };
    case USER_ROLE.REGISTRATION_OFFICER:
      return {
        title: 'Registration Officer guide',
        body: [
          'Register Borrower starts a new KYC application with photos and guarantor details.',
          'My Registrations tracks drafts and submitted applications.',
          'Update your profile photo and preferences under Settings.',
          'Approvers review what you submit — you cannot approve your own applications.',
        ],
      };
    case USER_ROLE.APPROVER:
      return {
        title: 'Approver guide',
        body: [
          'Pending Queue lists applications waiting for your decision.',
          'Offline Sync resolves conflicts from collector devices.',
          'Reviewed shows past approve/reject decisions.',
          'Use Settings for profile and notification preferences.',
        ],
      };
    case USER_ROLE.AUDITOR:
      return {
        title: 'Auditor guide',
        body: [
          'Reports and Audit Log are read-only.',
          'You cannot change loans, payments, or user roles.',
          'Export reports from the Reports area when needed for reviews.',
        ],
      };
    default:
      return {
        title: 'WILMS guide',
        body: ['Use the sidebar to move between your assigned pages.', 'Open Settings from the header for your profile preferences.'],
      };
  }
}

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
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const replayTour = useReplayProductTour();
  const isOpen = useUiStore((state) => state.isHelpMenuOpen);
  const closeHelpMenu = useUiStore((state) => state.closeHelpMenu);
  const [pane, setPane] = useState<HelpPane>('menu');

  useEffect(() => {
    if (!isAuthenticated && isOpen) {
      closeHelpMenu();
    }
  }, [closeHelpMenu, isAuthenticated, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPane('menu');
    }
  }, [isOpen]);

  const guide = useMemo(() => roleGuideCopy(user?.role), [user?.role]);
  const settingsHref = resolveSettingsHref(user?.role);
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'your role';

  if (!isAuthenticated) {
    return null;
  }

  const title =
    pane === 'role-guide' ? guide.title : pane === 'shortcuts' ? 'Keyboard shortcuts' : 'Help';

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeHelpMenu}
      title={title}
    >
      {pane === 'menu' ? (
        <div className="space-y-wilms-3">
          <p className="text-small text-text-muted">
            Signed in as {roleLabel}. Choose a help topic — each opens a different guide.
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
            onClick={() => setPane('role-guide')}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            View role guide
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start gap-wilms-2"
            onClick={() => setPane('shortcuts')}
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
            Quick tips & shortcuts
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-wilms-2"
            onClick={() => {
              closeHelpMenu();
              router.push(settingsHref);
            }}
          >
            <Settings className="h-4 w-4" aria-hidden="true" />
            Open my settings
          </Button>
        </div>
      ) : null}

      {pane === 'role-guide' ? (
        <div className="space-y-wilms-3">
          <ul className="list-disc space-y-2 pl-5 text-body text-text-muted">
            {guide.body.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setPane('menu')}>
              Back
            </Button>
            <Button
              type="button"
              onClick={() => {
                closeHelpMenu();
                replayTour();
              }}
            >
              Start guided tour
            </Button>
          </div>
        </div>
      ) : null}

      {pane === 'shortcuts' ? (
        <div className="space-y-wilms-3">
          <dl className="space-y-2 text-body">
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-text-muted">Open search</dt>
              <dd className="font-semibold text-text-primary">⌘K / Ctrl K</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-text-muted">Move in search results</dt>
              <dd className="font-semibold text-text-primary">↑ ↓</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-text-muted">Open selected result</dt>
              <dd className="font-semibold text-text-primary">Enter</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-border py-2">
              <dt className="text-text-muted">Close dialogs</dt>
              <dd className="font-semibold text-text-primary">Esc</dd>
            </div>
          </dl>
          <p className="text-small text-text-muted">
            Tip: the Help button (header or bottom-right) always returns you here.
          </p>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setPane('menu')}>
              Back
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

/** @deprecated Prefer FloatingShellControls */
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
