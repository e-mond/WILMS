'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { cn } from '@/utils/cn';

const TOUR_COMPLETED_PREFIX = 'wilms-product-tour-completed';
const TOUR_WELCOME_PREFIX = 'wilms-product-tour-welcome';
const TOUR_NEVER_SHOW_KEY = 'wilms-product-tour-never-show';

export interface ProductTourStep {
  id: string;
  title: string;
  body: string;
  href?: string;
  targetSelector?: string;
}

const TOUR_STEPS_BY_ROLE: Partial<Record<UserRole, ProductTourStep[]>> = {
  [USER_ROLE.SUPER_ADMIN]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour will show you where to find key menus, tools, and pages in the WILMS portal.',
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      body: 'Review pool funds, disbursements, collections, and outstanding balances from your executive dashboard.',
      href: '/dashboard',
      targetSelector: '[data-tour="financial-overview"]',
    },
    {
      id: 'loan-pools',
      title: 'Loan Pools',
      body: 'Monitor capital utilisation, disbursements, and repayment rates for each regional pool.',
      href: '/loan-pools',
      targetSelector: '[data-tour="loan-pool-kpis"]',
    },
    {
      id: 'collections',
      title: 'Collections',
      body: 'Track daily collection performance and variance across assigned groups.',
      href: '/reports/daily-collection',
      targetSelector: '[data-tour="collection-kpis"]',
    },
    {
      id: 'reconciliation',
      title: 'Reconciliation',
      body: 'Review flagged reconciliations and approve or escalate cash variances.',
      href: '/reconciliation',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      body: 'Approve field expenses and monitor operational spend.',
      href: '/settings/expenses',
    },
    {
      id: 'reports',
      title: 'Reports',
      body: 'Open financial and operational reports for leadership reviews.',
      href: '/reports/daily-collection',
    },
    {
      id: 'communication',
      title: 'Communication Center',
      body: 'Send announcements, SMS, and email campaigns to staff and borrowers.',
      href: '/communication-center',
    },
    {
      id: 'settings',
      title: 'Settings',
      body: 'Configure integrations, users, and organisation preferences.',
      href: '/settings',
    },
    {
      id: 'roles',
      title: 'Roles & Permissions',
      body: 'Manage staff roles and assign granular permissions.',
      href: '/settings/roles',
    },
  ],
  [USER_ROLE.COLLECTOR]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour will show you where to find key menus, tools, and pages in the WILMS portal.',
    },
    {
      id: 'collector-dashboard',
      title: 'Dashboard',
      body: 'See today’s groups, expected collections, and record payments from assigned borrowers.',
      href: '/collector/dashboard',
    },
    {
      id: 'collections',
      title: 'Collections',
      body: 'Record payments and review your daily collection progress.',
      href: '/collector/dashboard',
    },
    {
      id: 'groups',
      title: 'Groups',
      body: 'View assigned groups and borrower membership details.',
      href: '/collector/groups',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      body: 'Submit field expenses for supervisor approval.',
      href: '/collector/expenses',
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Read and reply to supervisor messages from the inbox.',
      href: '/collector/messages',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      body: 'Watch the bell icon for alerts, messages, and system events.',
      targetSelector: '[data-tour="notifications-bell"]',
    },
  ],
  [USER_ROLE.REGISTRATION_OFFICER]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour will show you where to find key menus, tools, and pages in the WILMS portal.',
    },
    {
      id: 'register',
      title: 'New Registration',
      body: 'Complete the guided registration wizard with photos, ID documents, and GPS verification.',
      href: '/register',
    },
    {
      id: 'my-registrations',
      title: 'My Registrations',
      body: 'Monitor pending, approved, and rejected registrations you have submitted.',
      href: '/my-registrations',
    },
    {
      id: 'review-status',
      title: 'Review Status',
      body: 'Track approver decisions and follow up on returned applications.',
      href: '/my-registrations',
    },
    {
      id: 'documents',
      title: 'Document Uploads',
      body: 'Capture and upload borrower ID documents and signatures during registration.',
      href: '/register',
    },
  ],
  [USER_ROLE.APPROVER]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour will show you where to find key menus, tools, and pages in the WILMS portal.',
    },
    {
      id: 'pending-queue',
      title: 'Pending Reviews',
      body: 'Review borrower applications awaiting your decision.',
      href: '/approver/pending',
    },
    {
      id: 'borrower-details',
      title: 'Borrower Details',
      body: 'Inspect borrower profiles, guarantors, and registration history.',
      href: '/approver/pending',
    },
    {
      id: 'document-preview',
      title: 'Document Preview',
      body: 'Open ID and signature previews before approving applications.',
      href: '/approver/pending',
    },
    {
      id: 'decision-actions',
      title: 'Decision Actions',
      body: 'Approve or reject applications with documented reasons.',
      href: '/approver/pending',
    },
  ],
  [USER_ROLE.AUDITOR]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour will show you where to find key menus, tools, and pages in the WILMS portal.',
    },
    {
      id: 'audit-logs',
      title: 'Audit Logs',
      body: 'Review immutable audit entries for sensitive platform actions.',
      href: '/audit-log',
    },
    {
      id: 'reports',
      title: 'Reports',
      body: 'Access read-only financial and operational reports.',
      href: '/reports/daily-collection',
    },
    {
      id: 'exports',
      title: 'Financial Exports',
      body: 'Export report data for external compliance reviews.',
      href: '/reports/daily-collection',
    },
    {
      id: 'reconciliation-history',
      title: 'Reconciliation History',
      body: 'Inspect historical reconciliation decisions and variance notes.',
      href: '/reconciliation',
    },
  ],
};

function completedKey(role: UserRole): string {
  return `${TOUR_COMPLETED_PREFIX}:${role}`;
}

function welcomeKey(userId: string): string {
  return `${TOUR_WELCOME_PREFIX}:${userId}`;
}

function highlightTourTarget(selector?: string) {
  if (!selector) {
    return;
  }

  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add('ring-2', 'ring-brand-primary', 'ring-offset-2', 'relative', 'z-[121]');

  window.setTimeout(() => {
    element.classList.remove('ring-2', 'ring-brand-primary', 'ring-offset-2', 'relative', 'z-[121]');
  }, 2400);
}

type TourPhase = 'welcome' | 'tour' | 'exit-confirm' | 'idle';

export function useProductTour() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const role = user?.role;
  const userId = user?.id;
  const steps = useMemo(
    () => (role ? TOUR_STEPS_BY_ROLE[role] ?? [] : []),
    [role],
  );
  const [phase, setPhase] = useState<TourPhase>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const persistDismissal = useCallback(() => {
    if (neverShowAgain) {
      localStorage.setItem(TOUR_NEVER_SHOW_KEY, 'true');
    }
    if (userId) {
      localStorage.setItem(welcomeKey(userId), 'dismissed');
    }
    if (role) {
      localStorage.setItem(completedKey(role), 'true');
    }
  }, [neverShowAgain, role, userId]);

  const openWelcome = useCallback(() => {
    if (!steps.length) {
      return;
    }
    setStepIndex(0);
    setPhase('welcome');
  }, [steps.length]);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setPhase('tour');
  }, []);

  const closeTour = useCallback(() => {
    persistDismissal();
    setPhase('idle');
  }, [persistDismissal]);

  const requestExit = useCallback(() => {
    setPhase('exit-confirm');
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !role || !userId || !steps.length) {
      return;
    }

    if (localStorage.getItem(TOUR_NEVER_SHOW_KEY) === 'true') {
      return;
    }

    if (localStorage.getItem(completedKey(role)) === 'true') {
      return;
    }

    if (localStorage.getItem(welcomeKey(userId)) === 'dismissed') {
      return;
    }

    const timer = window.setTimeout(() => {
      setPhase('welcome');
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, role, steps.length, userId]);

  useEffect(() => {
    if (phase !== 'tour') {
      return;
    }

    const step = steps[stepIndex];
    if (!step) {
      return;
    }

    if (step.href) {
      router.push(step.href);
    }

    const timer = window.setTimeout(() => {
      highlightTourTarget(step.targetSelector);
    }, step.href ? 500 : 100);

    return () => window.clearTimeout(timer);
  }, [phase, router, stepIndex, steps]);

  const step = steps[stepIndex];

  return {
    steps,
    step,
    stepIndex,
    phase,
    neverShowAgain,
    setNeverShowAgain,
    openWelcome,
    startTour,
    closeTour,
    requestExit,
    resumeTour: () => setPhase('tour'),
    nextStep: () => {
      if (stepIndex >= steps.length - 1) {
        closeTour();
        return;
      }
      setStepIndex((current) => current + 1);
    },
    previousStep: () => setStepIndex((current) => Math.max(0, current - 1)),
  };
}

function TourDialogShell({
  title,
  children,
  onKeyDown,
}: {
  title: string;
  children: ReactNode;
  onKeyDown?: (event: KeyboardEvent) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const root = dialogRef.current;
    if (!root) {
      return;
    }

    const focusables = () =>
      Array.from(
        root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute('disabled'));

    const first = focusables()[0];
    first?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Tab') {
        return;
      }
      const items = focusables();
      if (items.length === 0) {
        return;
      }
      const firstItem = items[0]!;
      const lastItem = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    }

    root.addEventListener('keydown', handleKeyDown);
    return () => {
      root.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-wilms-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      onKeyDown={onKeyDown}
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-wilms-5 shadow-lg">
        <h2 id="product-tour-title" className="text-heading-2 font-semibold text-text-primary">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export function ProductTourOverlay() {
  const tour = useProductTour();

  if (tour.phase === 'idle') {
    return null;
  }

  if ((tour.phase === 'tour' || tour.phase === 'exit-confirm') && !tour.step) {
    return null;
  }

  if (tour.phase === 'welcome') {
    return (
      <TourDialogShell title="Welcome to WILMS">
        <p className="mt-wilms-3 text-body text-text-muted">
          Would you like a quick guided tour of the portal? We will highlight key menus and pages so
          you can get started faster.
        </p>
        <div className="mt-wilms-4">
          <Checkbox
            label="Don't show this again"
            checked={tour.neverShowAgain}
            onChange={(event) => tour.setNeverShowAgain(event.target.checked)}
          />
        </div>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              tour.setNeverShowAgain(tour.neverShowAgain);
              tour.closeTour();
            }}
          >
            Not Now
          </Button>
          <Button type="button" onClick={tour.startTour}>
            Start Tour
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase === 'exit-confirm') {
    return (
      <TourDialogShell title="Exit guided tour?">
        <p className="mt-wilms-3 text-body text-text-muted">
          You are leaving the guided tour. You can open it again anytime using the help button at
          the bottom right of your screen.
        </p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button type="button" variant="secondary" onClick={tour.resumeTour}>
            Continue Tour
          </Button>
          <Button type="button" variant="ghost" onClick={tour.closeTour}>
            Exit Tour
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  return (
    <TourDialogShell
      title={tour.step.title}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          tour.requestExit();
        }
        if (event.key === 'ArrowRight') {
          tour.nextStep();
        }
        if (event.key === 'ArrowLeft') {
          tour.previousStep();
        }
      }}
    >
      <p className="mt-wilms-2 text-small font-semibold text-brand-primary">
        Step {tour.stepIndex + 1} of {tour.steps.length}
      </p>
      <p className="mt-wilms-3 text-body text-text-muted">{tour.step.body}</p>
      <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
        <Button type="button" variant="ghost" onClick={tour.requestExit}>
          Exit
        </Button>
        {tour.stepIndex > 0 ? (
          <Button type="button" variant="secondary" onClick={tour.previousStep}>
            Back
          </Button>
        ) : null}
        <Button type="button" className={cn('min-w-[6rem]')} onClick={tour.nextStep}>
          {tour.stepIndex >= tour.steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </TourDialogShell>
  );
}

export function useReplayProductTour() {
  const { user } = useAuth();

  return useCallback(() => {
    if (!user?.role || !user.id) {
      return;
    }
    localStorage.removeItem(completedKey(user.role));
    localStorage.removeItem(welcomeKey(user.id));
    localStorage.removeItem(TOUR_NEVER_SHOW_KEY);
    window.location.reload();
  }, [user?.id, user?.role]);
}

export function clearProductTourPreferences(userId: string, role: UserRole): void {
  localStorage.removeItem(completedKey(role));
  localStorage.removeItem(welcomeKey(userId));
  localStorage.removeItem(TOUR_NEVER_SHOW_KEY);
}
