'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { cn } from '@/utils/cn';

const TOUR_COMPLETED_PREFIX = 'wilms-product-tour-completed';
const TOUR_WELCOME_PREFIX = 'wilms-product-tour-welcome';
const TOUR_NEVER_SHOW_KEY = 'wilms-product-tour-never-show';
const TOUR_PROGRESS_PREFIX = 'wilms-product-tour-progress';
const TOUR_ANALYTICS_PREFIX = 'wilms-product-tour-analytics';

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
      targetSelector: '[data-tour="financial-overview"], [data-tour-nav="/dashboard"]',
    },
    {
      id: 'operations',
      title: 'Operations',
      body: 'Open the platform control centre for system health, workers, queues, and runtime status. This is separate from the executive Dashboard.',
      href: '/ops',
      targetSelector: '[data-tour="operations-dashboard"], [data-tour-nav="/ops"]',
    },
    {
      id: 'loan-pools',
      title: 'Loan Pools',
      body: 'Monitor capital utilisation, disbursements, and repayment rates for each regional pool. Assign groups when you create a pool so disbursements update utilisation.',
      href: '/loan-pools',
      targetSelector: '[data-tour="loan-pool-kpis"], [data-tour-nav="/loan-pools"]',
    },
    {
      id: 'collections',
      title: 'Collections',
      body: 'Track daily collection performance and review reconciliations across assigned groups.',
      href: '/reports/daily-collection',
      targetSelector: '[data-tour="collection-kpis"], [data-tour-nav="/reports/daily-collection"]',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      body: 'Record and review field operating expenses. Expenses reduce operating cash, not loan principal.',
      href: '/expenses',
      targetSelector: '[data-tour-nav="/expenses"]',
    },
    {
      id: 'reports',
      title: 'Reports',
      body: 'Open financial and operational reports for leadership reviews.',
      href: '/reports',
      targetSelector: '[data-tour-nav="/reports"]',
    },
    {
      id: 'communication',
      title: 'Communication Center',
      body: 'Send announcements, SMS, and email campaigns to staff and borrowers.',
      href: '/communication-center',
      targetSelector: '[data-tour-nav="/communication-center"]',
    },
    {
      id: 'settings',
      title: 'Settings',
      body: 'Configure integrations, users, roles, and organisation preferences.',
      href: '/settings?section=roles',
      targetSelector: '[data-tour-nav="/settings"]',
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
      targetSelector: '[data-tour-nav="/collector/dashboard"]',
    },
    {
      id: 'collections',
      title: 'Borrowers',
      body: 'Open assigned borrowers and jump into collection sheets for today’s groups.',
      href: '/collector/my-borrowers',
      targetSelector: '[data-tour-nav="/collector/my-borrowers"]',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      body: 'Record field expenses with receipts. Operating spend never changes loan principal.',
      href: '/collector/expenses',
      targetSelector: '[data-tour-nav="/collector/expenses"]',
    },
    {
      id: 'reconciliation',
      title: 'Reconcile',
      body: 'Submit daily cash reconciliation and flag variances when needed.',
      href: '/collector/reconciliation',
      targetSelector: '[data-tour-nav="/collector/reconciliation"]',
    },
    {
      id: 'messages',
      title: 'Messages',
      body: 'Read and reply to supervisor messages from the inbox.',
      href: '/collector/messages',
      targetSelector: '[data-tour-nav="/collector/messages"]',
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
      body: 'This short tour highlights registration, document capture, and tracking your submissions.',
    },
    {
      id: 'register',
      title: 'New Registration',
      body: 'Complete the guided registration wizard with photos, ID documents, and GPS verification.',
      href: '/officer/register',
      targetSelector: '[data-tour-nav="/officer/register"]',
    },
    {
      id: 'my-registrations',
      title: 'My Registrations',
      body: 'Monitor pending, approved, and rejected registrations. Follow up when an approver returns an application.',
      href: '/officer/my-registrations',
      targetSelector: '[data-tour-nav="/officer/my-registrations"]',
    },
  ],
  [USER_ROLE.APPROVER]: [
    {
      id: 'intro',
      title: 'Quick Tour',
      body: 'This short tour covers your approval queue and how to make documented decisions.',
    },
    {
      id: 'pending-queue',
      title: 'Pending Reviews',
      body: 'Open the queue to inspect borrower profiles, documents, and guarantors — then approve or reject with a reason.',
      href: '/approver/pending',
      targetSelector: '[data-tour-nav="/approver/pending"]',
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
      href: '/auditor/audit-log',
      targetSelector: '[data-tour-nav="/auditor/audit-log"]',
    },
    {
      id: 'reports',
      title: 'Reports',
      body: 'Access read-only financial and operational reports.',
      href: '/auditor/reports',
      targetSelector: '[data-tour-nav="/auditor/reports"]',
    },
    {
      id: 'exports',
      title: 'Financial Exports',
      body: 'Export report data for external compliance reviews.',
      href: '/auditor/reports',
      targetSelector: '[data-tour-nav="/auditor/reports"]',
    },
    {
      id: 'settings',
      title: 'Settings',
      body: 'Adjust audit preferences and account security options.',
      href: '/auditor/settings',
      targetSelector: '[data-tour-nav="/auditor/settings"]',
    },
  ],
};

function completedKey(role: UserRole): string {
  return `${TOUR_COMPLETED_PREFIX}:${role}`;
}

function welcomeKey(userId: string): string {
  return `${TOUR_WELCOME_PREFIX}:${userId}`;
}

function progressKey(role: UserRole): string {
  return `${TOUR_PROGRESS_PREFIX}:${role}`;
}

function analyticsKey(role: UserRole): string {
  return `${TOUR_ANALYTICS_PREFIX}:${role}`;
}

function recordTourAnalytics(role: UserRole, event: string, stepId?: string) {
  try {
    const raw = localStorage.getItem(analyticsKey(role));
    const existing = raw ? (JSON.parse(raw) as Array<Record<string, string>>) : [];
    existing.push({
      event,
      stepId: stepId ?? '',
      at: new Date().toISOString(),
    });
    localStorage.setItem(analyticsKey(role), JSON.stringify(existing.slice(-50)));
  } catch {
    // Analytics must never break the tour.
  }
}

const HIGHLIGHT_CLASSES = [
  'ring-2',
  'ring-brand-primary',
  'ring-offset-2',
  'relative',
  'z-[121]',
  'tour-highlight-pulse',
] as const;

function clearTourHighlights() {
  document.querySelectorAll('.tour-highlight-pulse').forEach((element) => {
    element.classList.remove(...HIGHLIGHT_CLASSES);
  });
}

function highlightTourTarget(selector?: string) {
  clearTourHighlights();
  if (!selector) {
    return;
  }

  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    return;
  }

  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  element.classList.add(...HIGHLIGHT_CLASSES);
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
  const [isNavigating, setIsNavigating] = useState(false);

  const persistDismissal = useCallback(
    (options?: { neverShowAgain?: boolean }) => {
      const shouldNeverShow = options?.neverShowAgain ?? neverShowAgain;
      if (shouldNeverShow) {
        localStorage.setItem(TOUR_NEVER_SHOW_KEY, 'true');
      }
      if (userId) {
        localStorage.setItem(welcomeKey(userId), 'dismissed');
      }
      if (role) {
        localStorage.setItem(completedKey(role), 'true');
      }
    },
    [neverShowAgain, role, userId],
  );

  const openWelcome = useCallback(() => {
    if (!steps.length) {
      return;
    }
    setStepIndex(0);
    setPhase('welcome');
  }, [steps.length]);

  const startTour = useCallback(() => {
    let resumeAt = 0;
    if (role) {
      const saved = Number(localStorage.getItem(progressKey(role)) ?? '0');
      if (Number.isFinite(saved) && saved > 0 && saved < steps.length) {
        resumeAt = saved;
      }
      recordTourAnalytics(role, resumeAt > 0 ? 'tour_resumed' : 'tour_started', steps[resumeAt]?.id);
    }
    setStepIndex(resumeAt);
    setPhase('tour');
  }, [role, steps]);

  const closeTour = useCallback(
    (options?: { neverShowAgain?: boolean }) => {
      clearTourHighlights();
      if (role) {
        localStorage.removeItem(progressKey(role));
        recordTourAnalytics(role, 'tour_completed_or_exited', steps[stepIndex]?.id);
      }
      if (typeof options?.neverShowAgain === 'boolean') {
        setNeverShowAgain(options.neverShowAgain);
      }
      persistDismissal(options);
      setPhase('idle');
      setIsNavigating(false);
    },
    [persistDismissal, role, stepIndex, steps],
  );

  const pauseTourForLater = useCallback(() => {
    clearTourHighlights();
    if (role) {
      localStorage.setItem(progressKey(role), String(stepIndex));
      // Allow resume: clear completed/welcome dismissal without "never show"
      localStorage.removeItem(completedKey(role));
      if (userId) {
        localStorage.removeItem(welcomeKey(userId));
      }
      recordTourAnalytics(role, 'tour_paused', steps[stepIndex]?.id);
    }
    setPhase('idle');
    setIsNavigating(false);
  }, [role, stepIndex, steps, userId]);

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

    let cancelled = false;
    let highlightTimer: number | undefined;
    let navigateTimer: number | undefined;

    const runHighlight = () => {
      if (cancelled) {
        return;
      }
      highlightTourTarget(step.targetSelector);
      setIsNavigating(false);
    };

    if (step.href) {
      setIsNavigating(true);
      router.push(step.href);
      navigateTimer = window.setTimeout(runHighlight, 700);
    } else {
      highlightTimer = window.setTimeout(runHighlight, 120);
    }

    return () => {
      cancelled = true;
      if (highlightTimer) {
        window.clearTimeout(highlightTimer);
      }
      if (navigateTimer) {
        window.clearTimeout(navigateTimer);
      }
    };
  }, [phase, router, stepIndex, steps]);

  useEffect(() => {
    return () => {
      clearTourHighlights();
    };
  }, []);

  const step = steps[stepIndex];
  const progressPercent = steps.length > 0 ? Math.round(((stepIndex + 1) / steps.length) * 100) : 0;

  return {
    steps,
    step,
    stepIndex,
    phase,
    neverShowAgain,
    setNeverShowAgain,
    isNavigating,
    progressPercent,
    openWelcome,
    startTour,
    closeTour,
    pauseTourForLater,
    requestExit,
    resumeTour: () => setPhase('tour'),
    nextStep: () => {
      if (stepIndex >= steps.length - 1) {
        closeTour();
        return;
      }
      const next = stepIndex + 1;
      setStepIndex(next);
      if (role) {
        localStorage.setItem(progressKey(role), String(next));
        recordTourAnalytics(role, 'tour_step', steps[next]?.id);
      }
    },
    previousStep: () => {
      const prev = Math.max(0, stepIndex - 1);
      setStepIndex(prev);
      if (role) {
        localStorage.setItem(progressKey(role), String(prev));
      }
    },
  };
}

function TourDialogShell({
  title,
  children,
  onKeyDown,
  progressPercent,
}: {
  title: string;
  children: ReactNode;
  onKeyDown?: (event: KeyboardEvent) => void;
  progressPercent?: number;
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
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-wilms-4 backdrop-blur-[1px] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      onKeyDown={onKeyDown}
    >
      <div className="tour-dialog-panel w-full max-w-lg overflow-hidden rounded-sm border border-border bg-card shadow-lg">
        {typeof progressPercent === 'number' ? (
          <div
            className="h-1 bg-border"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
            aria-label="Tour progress"
          >
            <div
              className="h-full bg-brand-primary transition-[width] duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        ) : null}
        <div className="p-wilms-5">
          <h2 id="product-tour-title" className="text-heading-2 font-semibold text-text-primary">
            {title}
          </h2>
          {children}
        </div>
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
          Would you like a quick guided tour of the portal? We&apos;ll highlight key menus and pages
          so you can get started faster.
        </p>
        <p className="mt-wilms-2 text-small text-text-muted">
          You can restart the guided tour anytime using the Help button at the bottom-right of your
          screen, or from the help icon in the header.
        </p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => tour.closeTour({ neverShowAgain: true })}
          >
            Don&apos;t Show This Again
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => tour.closeTour({ neverShowAgain: false })}
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
      <TourDialogShell title="Exit guided tour?" progressPercent={tour.progressPercent}>
        <p className="mt-wilms-3 text-body text-text-muted">
          You are leaving the guided tour. You can open it again anytime using the Help button at
          the bottom-right of your screen.
        </p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button type="button" variant="secondary" onClick={tour.resumeTour}>
            Continue Tour
          </Button>
          <Button type="button" variant="ghost" onClick={() => tour.closeTour()}>
            Exit Tour
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  return (
    <TourDialogShell
      title={tour.step.title}
      progressPercent={tour.progressPercent}
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
      <div className="mt-wilms-2 flex items-center justify-between gap-wilms-3">
        <p className="text-small font-semibold text-brand-primary">
          Step {tour.stepIndex + 1} of {tour.steps.length}
        </p>
        {tour.isNavigating ? (
          <p className="text-small text-text-muted" aria-live="polite">
            Opening page…
          </p>
        ) : null}
      </div>
      <div className="mt-wilms-2 flex flex-wrap gap-1" aria-hidden="true">
        {tour.steps.map((entry, index) => (
          <span
            key={entry.id}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors',
              index <= tour.stepIndex ? 'bg-brand-primary' : 'bg-border',
            )}
          />
        ))}
      </div>
      <p className="mt-wilms-3 text-body text-text-muted">{tour.step.body}</p>
      <p className="mt-wilms-2 text-small text-text-muted">
        Tip: use ← → keys to move, Esc to exit.
      </p>
      <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
        <Button type="button" variant="ghost" onClick={tour.pauseTourForLater}>
          Resume later
        </Button>
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
    localStorage.removeItem(progressKey(user.role));
    window.location.reload();
  }, [user?.id, user?.role]);
}
