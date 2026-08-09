'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { cn } from '@/utils/cn';

const TOUR_COMPLETED_PREFIX = 'wilms-product-tour-completed';
const TOUR_WELCOME_PREFIX = 'wilms-product-tour-welcome';
const TOUR_NEVER_SHOW_KEY = 'wilms-product-tour-never-show';
const TOUR_PROGRESS_PREFIX = 'wilms-product-tour-progress';
const TOUR_ANALYTICS_PREFIX = 'wilms-product-tour-analytics';

const SPOTLIGHT_PAD = 10;

export interface ProductTourStep {
  id: string;
  title: string;
  body: string;
  href?: string;
  targetSelector?: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourCompletionContent {
  nextAction: { label: string; href: string };
  checklist: [string, string, string];
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
      body: 'Start on the Operational Dashboard for work queues and daily financials, then open Executive Intelligence for board-grade KPIs and forecasts.',
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
      title: 'Reports & exports',
      body: 'Open financial and operational reports. Export PDF, Excel, CSV, or Word from each report and dashboard toolbar — there is no separate Exports page.',
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
    {
      id: 'offline',
      title: 'Offline readiness',
      body: 'WILMS caches key shell pages and queues field changes. Watch the offline banner and retry sync when connectivity returns.',
      href: '/dashboard',
      targetSelector: '[data-testid="operational-dashboard"]',
    },
    {
      id: 'push',
      title: 'Push notifications',
      body: 'Enable browser push in Settings → Notifications for approvals, holiday status, sync conflicts, and reconciliation alerts.',
      href: '/settings',
      targetSelector: '[data-tour="push-notifications"]',
    },
    {
      id: 'holidays',
      title: 'Holiday requests',
      body: 'Review collector holiday requests under Settings → Holidays. Maker-checker prevents self-approval.',
      href: '/settings?section=holidays',
      targetSelector: '[data-tour-nav="/settings"]',
    },
    {
      id: 'app-lock',
      title: 'App Lock',
      body: 'Set a PIN, choose an idle timeout, and optionally enrol biometrics to protect field devices.',
      href: '/settings',
      targetSelector: '[data-tour="app-lock"]',
    },
    {
      id: 'automation',
      title: 'Automation',
      body: 'Open Settings → Automation to review reminder ladders, escalations, follow-ups, and run the daily automation pass.',
      href: '/settings?section=automation',
      targetSelector: '[data-tour-nav="/settings"]',
    },
    {
      id: 'documentation',
      title: 'Documentation Centre',
      body: 'Browse the branded product, technical, and operations books from the Documentation Centre.',
      href: '/documentation',
      targetSelector: '[data-tour-nav="/documentation"]',
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
      body: "See today's groups, expected collections, and record payments from assigned borrowers.",
      href: '/collector/dashboard',
      targetSelector: '[data-tour-nav="/collector/dashboard"]',
    },
    {
      id: 'collections',
      title: 'Borrowers',
      body: "Open assigned borrowers and jump into collection sheets for today's groups.",
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
      id: 'notifications',
      title: 'Notifications',
      body: 'Watch the bell icon for alerts and system events.',
      targetSelector: '[data-tour="notifications-bell"]',
    },
    {
      id: 'holidays',
      title: 'Holidays',
      body: 'Request organisation holidays that shift repayment schedules after approval. Drafts can be queued offline.',
      href: '/collector/holidays',
      targetSelector: '[data-tour-nav="/collector/holidays"]',
    },
    {
      id: 'offline',
      title: 'Offline queue',
      body: 'When offline, payments, expenses, and holiday requests are saved locally and synced when you reconnect.',
      href: '/collector/dashboard',
      targetSelector: '[data-tour-nav="/collector/dashboard"]',
    },
    {
      id: 'app-lock',
      title: 'App Lock',
      body: 'Protect this device with a PIN under Settings. Biometrics can unlock when available; PIN remains the fallback.',
      href: '/collector/settings',
      targetSelector: '[data-tour="app-lock"], [data-tour-nav="/collector/settings"]',
    },
    {
      id: 'push',
      title: 'Push notifications',
      body: 'Enable browser push in Settings so holiday approvals and sync alerts reach this device.',
      href: '/collector/settings',
      targetSelector: '[data-tour="push-notifications"], [data-tour-nav="/collector/settings"]',
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
    {
      id: 'offline',
      title: 'Offline readiness',
      body: 'Shell pages remain available offline. Watch the banner and sync panel when connectivity returns.',
      href: '/officer/register',
      targetSelector: '[data-tour-nav="/officer/register"]',
    },
    {
      id: 'app-lock',
      title: 'App Lock',
      body: 'Protect registration devices with PIN and optional biometrics under Settings.',
      href: '/officer/settings',
      targetSelector: '[data-tour="app-lock"], [data-tour-nav="/officer/settings"]',
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
    {
      id: 'holidays',
      title: 'Holiday requests',
      body: 'Review collector holiday requests with maker-checker. You cannot approve a request you created.',
      href: '/approver/holidays',
      targetSelector: '[data-tour-nav="/approver/holidays"]',
    },
    {
      id: 'offline-sync',
      title: 'Offline sync conflicts',
      body: 'Approve or reject financial operations captured while collectors were offline.',
      href: '/approver/sync-conflicts',
      targetSelector: '[data-tour-nav="/approver/sync-conflicts"]',
    },
    {
      id: 'app-lock',
      title: 'App Lock',
      body: 'Protect approval sessions with PIN idle lock under Settings.',
      href: '/approver/settings',
      targetSelector: '[data-tour="app-lock"], [data-tour-nav="/approver/settings"]',
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

function measureSpotlight(selector?: string): SpotlightRect | null {
  if (!selector) {
    return null;
  }

  const element = document.querySelector(selector);
  if (!(element instanceof HTMLElement)) {
    return null;
  }

  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 && rect.height <= 0) {
    return null;
  }

  return {
    top: Math.max(0, rect.top - SPOTLIGHT_PAD),
    left: Math.max(0, rect.left - SPOTLIGHT_PAD),
    width: rect.width + SPOTLIGHT_PAD * 2,
    height: rect.height + SPOTLIGHT_PAD * 2,
  };
}

function scrollTourTarget(selector?: string) {
  if (!selector) {
    return;
  }
  const element = document.querySelector(selector);
  if (element instanceof HTMLElement) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }
}

function getTourCompletion(role: UserRole): TourCompletionContent {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return {
        nextAction: { label: 'Open Operational Dashboard', href: '/dashboard' },
        checklist: [
          'Review Operational Dashboard work queues',
          'Open Executive Intelligence for board KPIs',
          'Invite a team member under Settings → Users',
        ],
      };
    case USER_ROLE.COLLECTOR:
      return {
        nextAction: { label: 'Go to collector dashboard', href: '/collector/dashboard' },
        checklist: [
          "Open today's assigned groups",
          'Record a borrower payment',
          'Submit daily cash reconciliation',
        ],
      };
    case USER_ROLE.REGISTRATION_OFFICER:
      return {
        nextAction: { label: 'Start a registration', href: '/officer/register' },
        checklist: [
          'Begin a new borrower registration',
          'Capture ID photos and GPS as prompted',
          'Track status under My Registrations',
        ],
      };
    case USER_ROLE.APPROVER:
      return {
        nextAction: { label: 'Open pending reviews', href: '/approver/pending' },
        checklist: [
          'Open the pending approval queue',
          'Review documents and guarantors',
          'Approve or reject with a documented reason',
        ],
      };
    case USER_ROLE.AUDITOR:
      return {
        nextAction: { label: 'Open audit log', href: '/auditor/audit-log' },
        checklist: [
          'Review recent immutable audit entries',
          'Open read-only reports for compliance',
          'Export data when an external review needs it',
        ],
      };
    default:
      return {
        nextAction: { label: 'Continue', href: '/' },
        checklist: [
          'Explore your role home page',
          'Open Help anytime to replay this tour',
          'Update your profile under Settings',
        ],
      };
  }
}

type TourPhase = 'welcome' | 'tour' | 'exit-confirm' | 'complete' | 'idle';

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
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);

  const completion = useMemo(
    () => (role ? getTourCompletion(role) : null),
    [role],
  );

  const refreshSpotlight = useCallback((selector?: string) => {
    setSpotlight(measureSpotlight(selector));
  }, []);

  const clearSpotlight = useCallback(() => {
    setSpotlight(null);
  }, []);

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
      clearSpotlight();
      if (role) {
        localStorage.removeItem(progressKey(role));
        recordTourAnalytics(role, 'tour_completed_or_exited', steps[stepIndex]?.id);
      }
      if (typeof options?.neverShowAgain === 'boolean') {
        setNeverShowAgain(options.neverShowAgain);
      }
      persistDismissal(options);
      setHasSavedProgress(false);
      setPhase('idle');
      setIsNavigating(false);
    },
    [clearSpotlight, persistDismissal, role, stepIndex, steps],
  );

  const finishTour = useCallback(() => {
    clearSpotlight();
    if (role) {
      localStorage.removeItem(progressKey(role));
      recordTourAnalytics(role, 'tour_completed', steps[stepIndex]?.id);
      localStorage.setItem(completedKey(role), 'true');
    }
    if (userId) {
      localStorage.setItem(welcomeKey(userId), 'dismissed');
    }
    setHasSavedProgress(false);
    setIsNavigating(false);
    setPhase('complete');
  }, [clearSpotlight, role, stepIndex, steps, userId]);

  const dismissCompletion = useCallback(() => {
    setPhase('idle');
  }, []);

  const pauseTourForLater = useCallback(() => {
    clearSpotlight();
    if (role) {
      localStorage.setItem(progressKey(role), String(stepIndex));
      // Allow resume: clear completed/welcome dismissal without "never show"
      localStorage.removeItem(completedKey(role));
      if (userId) {
        localStorage.removeItem(welcomeKey(userId));
      }
      recordTourAnalytics(role, 'tour_paused', steps[stepIndex]?.id);
      setHasSavedProgress(true);
    }
    setPhase('idle');
    setIsNavigating(false);
  }, [clearSpotlight, role, stepIndex, steps, userId]);

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

    const saved = Number(localStorage.getItem(progressKey(role)) ?? '0');
    setHasSavedProgress(Number.isFinite(saved) && saved > 0 && saved < steps.length);

    const timer = window.setTimeout(() => {
      setPhase('welcome');
    }, 900);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, role, steps.length, userId]);

  useEffect(() => {
    if (phase !== 'tour') {
      clearSpotlight();
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
      scrollTourTarget(step.targetSelector);
      window.setTimeout(() => {
        if (!cancelled) {
          refreshSpotlight(step.targetSelector);
        }
      }, 280);
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
  }, [clearSpotlight, phase, refreshSpotlight, router, stepIndex, steps]);

  useEffect(() => {
    if (phase !== 'tour') {
      return;
    }

    const step = steps[stepIndex];
    if (!step?.targetSelector) {
      return;
    }

    const onLayoutChange = () => refreshSpotlight(step.targetSelector);
    window.addEventListener('resize', onLayoutChange);
    window.addEventListener('scroll', onLayoutChange, true);
    return () => {
      window.removeEventListener('resize', onLayoutChange);
      window.removeEventListener('scroll', onLayoutChange, true);
    };
  }, [phase, refreshSpotlight, stepIndex, steps]);

  useEffect(() => {
    return () => {
      clearSpotlight();
    };
  }, [clearSpotlight]);

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
    spotlight,
    hasSavedProgress,
    completion,
    openWelcome,
    startTour,
    closeTour,
    finishTour,
    dismissCompletion,
    pauseTourForLater,
    requestExit,
    resumeTour: () => setPhase('tour'),
    nextStep: () => {
      if (stepIndex >= steps.length - 1) {
        finishTour();
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

function TourSpotlight({ rect }: { rect: SpotlightRect | null }) {
  const veil = 'bg-black/50 backdrop-blur-[2px]';

  if (!rect) {
    return <div className={cn('fixed inset-0 z-[119]', veil)} aria-hidden="true" />;
  }

  const { top, left, width, height } = rect;

  return (
    <div className="pointer-events-none fixed inset-0 z-[119]" aria-hidden="true">
      <div className={cn('absolute left-0 right-0 top-0', veil)} style={{ height: top }} />
      <div
        className={cn('absolute bottom-0 left-0 right-0', veil)}
        style={{ top: top + height }}
      />
      <div className={cn('absolute left-0', veil)} style={{ top, height, width: left }} />
      <div
        className={cn('absolute right-0', veil)}
        style={{ top, height, left: left + width }}
      />
      <div
        className="tour-highlight-pulse absolute rounded-sm ring-2 ring-brand-primary ring-offset-2 ring-offset-transparent"
        style={{ top, left, width, height }}
      />
      {/* Block clicks through the cut-out without covering the visual hole */}
      <div className="pointer-events-auto absolute" style={{ top, left, width, height }} />
    </div>
  );
}

function TourDialogShell({
  title,
  children,
  onKeyDown,
  progressPercent,
  showSpotlight,
  spotlight,
  compact,
}: {
  title: string;
  children: ReactNode;
  onKeyDown?: (event: KeyboardEvent) => void;
  progressPercent?: number;
  showSpotlight?: boolean;
  spotlight?: SpotlightRect | null;
  compact?: boolean;
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
      className={cn(
        'fixed inset-0 z-[120] flex p-wilms-4',
        showSpotlight ? 'items-end justify-center sm:items-end sm:justify-end' : 'items-end justify-center sm:items-center',
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
      onKeyDown={onKeyDown}
    >
      {showSpotlight ? <TourSpotlight rect={spotlight ?? null} /> : (
        <div className="fixed inset-0 z-[119] bg-black/45 backdrop-blur-[2px]" aria-hidden="true" />
      )}
      <div
        className={cn(
          'tour-dialog-panel relative z-[122] w-full overflow-hidden rounded-sm border border-border bg-card shadow-lg',
          compact ? 'max-w-md' : 'max-w-lg',
        )}
      >
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
          WILMS is the Women&apos;s Interest-Free Loan Management System — your workspace for pools,
          registrations, collections, approvals, and reporting.
        </p>
        <p className="mt-wilms-2 text-body text-text-muted">
          This guided tour highlights the menus and pages you will use most often for your role.
        </p>
        <p className="mt-wilms-2 text-small text-text-muted">
          Estimated time: about 3–5 minutes. You can pause and resume later, or restart anytime from
          Help.
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
            {tour.hasSavedProgress ? 'Resume Tour' : 'Start Tour'}
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase === 'complete' && tour.completion) {
    return (
      <TourDialogShell title="Tour complete" compact>
        <div className="mt-wilms-3 flex flex-wrap items-center gap-wilms-2">
          <Badge variant="success" className="gap-1.5">
            <Award className="h-3.5 w-3.5" aria-hidden="true" />
            Tour completed
          </Badge>
        </div>
        <p className="mt-wilms-3 text-body text-text-muted">
          You&apos;re ready to work in WILMS. Start with the recommended next step, then use the
          quick-start checklist below.
        </p>
        <div className="mt-wilms-4 rounded-sm border border-border bg-background p-wilms-3">
          <p className="text-small font-semibold text-text-primary">Next recommended action</p>
          <Link
            href={tour.completion.nextAction.href}
            className="mt-wilms-1 inline-flex text-body font-semibold text-brand-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            onClick={tour.dismissCompletion}
          >
            {tour.completion.nextAction.label}
          </Link>
        </div>
        <div className="mt-wilms-4">
          <p className="text-small font-semibold text-text-primary">Quick-start checklist</p>
          <ul className="mt-wilms-2 space-y-wilms-2">
            {tour.completion.checklist.map((item) => (
              <li key={item} className="flex items-start gap-wilms-2 text-body text-text-muted">
                <CheckCircle2
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button type="button" onClick={tour.dismissCompletion}>
            Done
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase === 'exit-confirm') {
    return (
      <TourDialogShell
        title="Exit guided tour?"
        progressPercent={tour.progressPercent}
        showSpotlight
        spotlight={tour.spotlight}
      >
        <p className="mt-wilms-3 text-body text-text-muted">
          You are leaving the guided tour. Progress will not be saved unless you pause instead. You
          can open the tour again anytime using Help.
        </p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button type="button" variant="secondary" onClick={tour.resumeTour}>
            Continue Tour
          </Button>
          <Button type="button" variant="ghost" onClick={tour.pauseTourForLater}>
            Pause
          </Button>
          <Button type="button" variant="ghost" onClick={() => tour.closeTour()}>
            Exit Tour
          </Button>
        </div>
      </TourDialogShell>
    );
  }

  if (tour.phase !== 'tour' || !tour.step) {
    return null;
  }

  return (
    <TourDialogShell
      title={tour.step.title}
      progressPercent={tour.progressPercent}
      showSpotlight
      spotlight={tour.spotlight}
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
        Tip: use ← → keys to move, Esc to exit. Pause saves progress (Resume later from welcome or Help).
      </p>
      <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
        <Button type="button" variant="ghost" onClick={tour.requestExit}>
          Skip
        </Button>
        <Button type="button" variant="ghost" onClick={tour.pauseTourForLater}>
          Pause
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
