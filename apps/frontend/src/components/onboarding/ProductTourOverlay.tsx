'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { cn } from '@/utils/cn';

const TOUR_STORAGE_PREFIX = 'wilms-product-tour-completed';

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
      id: 'dashboard',
      title: 'Executive dashboard',
      body: 'Review pool funds, disbursements, collections, and outstanding balances. Switch between KPI cards and charts in Financial Overview.',
      href: '/dashboard',
      targetSelector: '[data-tour="financial-overview"]',
    },
    {
      id: 'collections',
      title: 'Collections & reconciliation',
      body: 'Use Daily Collection to track expected vs collected variance and review flagged reconciliations.',
      href: '/reports/daily-collection',
      targetSelector: '[data-tour="collection-kpis"]',
    },
    {
      id: 'loan-pools',
      title: 'Loan pools',
      body: 'Monitor capital utilisation, disbursements, collected amounts, and repayment rates for each regional pool.',
      href: '/loan-pools',
      targetSelector: '[data-tour="loan-pool-kpis"]',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      body: 'Watch the bell icon for reconciliation alerts, messages, and system events. Enable sounds in settings.',
      targetSelector: '[data-tour="notifications-bell"]',
    },
  ],
  [USER_ROLE.COLLECTOR]: [
    {
      id: 'collector-dashboard',
      title: 'Field dashboard',
      body: 'See today’s groups, expected collections, and record payments from assigned borrowers.',
      href: '/collector/dashboard',
    },
    {
      id: 'collector-messages',
      title: 'Supervisor messages',
      body: 'Read and reply to administrator messages from the Messages inbox.',
      href: '/collector/messages',
    },
    {
      id: 'collector-reconcile',
      title: 'End-of-day reconciliation',
      body: 'Submit physical cash counts. Flagged variance triggers supervisor review.',
      href: '/collector/reconciliation',
    },
  ],
  [USER_ROLE.REGISTRATION_OFFICER]: [
    {
      id: 'register',
      title: 'Register borrowers',
      body: 'Complete the guided registration wizard with photos, ID documents, and GPS verification.',
      href: '/register',
    },
    {
      id: 'my-registrations',
      title: 'Track submissions',
      body: 'Monitor pending, approved, and rejected registrations from My Registrations.',
      href: '/my-registrations',
    },
  ],
  [USER_ROLE.APPROVER]: [
    {
      id: 'pending-queue',
      title: 'Approval queue',
      body: 'Review borrower applications, ID documents, and guarantor details before approving.',
      href: '/approver/pending',
    },
  ],
  [USER_ROLE.AUDITOR]: [
    {
      id: 'reports',
      title: 'Read-only reports',
      body: 'Access financial and operational reports without mutation permissions.',
      href: '/reports/daily-collection',
    },
  ],
};

function storageKey(role: UserRole): string {
  return `${TOUR_STORAGE_PREFIX}:${role}`;
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
  element.classList.add('ring-2', 'ring-brand-primary', 'ring-offset-2');

  window.setTimeout(() => {
    element.classList.remove('ring-2', 'ring-brand-primary', 'ring-offset-2');
  }, 2400);
}

export function useProductTour() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const role = user?.role;
  const steps = useMemo(
    () => (role ? TOUR_STEPS_BY_ROLE[role] ?? [] : []),
    [role],
  );
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const openTour = useCallback(() => {
    if (!steps.length) {
      return;
    }
    setStepIndex(0);
    setActive(true);
  }, [steps.length]);

  const closeTour = useCallback(() => {
    setActive(false);
    if (role) {
      localStorage.setItem(storageKey(role), 'true');
    }
  }, [role]);

  useEffect(() => {
    if (!isAuthenticated || !role || !steps.length) {
      return;
    }

    if (localStorage.getItem(storageKey(role)) === 'true') {
      return;
    }

    const timer = window.setTimeout(() => {
      setActive(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, role, steps.length]);

  useEffect(() => {
    if (!active) {
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
  }, [active, router, stepIndex, steps]);

  const step = steps[stepIndex];

  return {
    steps,
    step,
    stepIndex,
    active,
    openTour,
    closeTour,
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

export function ProductTourOverlay() {
  const tour = useProductTour();

  if (!tour.active || !tour.step) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/40 p-wilms-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-tour-title"
    >
      <div className="w-full max-w-lg rounded-sm border border-border bg-card p-wilms-5 shadow-lg">
        <p className="text-small font-semibold text-brand-primary">
          Step {tour.stepIndex + 1} of {tour.steps.length}
        </p>
        <h2 id="product-tour-title" className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">
          {tour.step.title}
        </h2>
        <p className="mt-wilms-3 text-body text-text-muted">{tour.step.body}</p>
        <div className="mt-wilms-5 flex flex-wrap justify-end gap-wilms-2">
          <Button type="button" variant="ghost" onClick={tour.closeTour}>
            Dismiss
          </Button>
          {tour.stepIndex > 0 ? (
            <Button type="button" variant="secondary" onClick={tour.previousStep}>
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            className={cn('min-w-[6rem]')}
            onClick={tour.nextStep}
          >
            {tour.stepIndex >= tour.steps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function useReplayProductTour() {
  const { user } = useAuth();

  return useCallback(() => {
    if (!user?.role) {
      return;
    }
    localStorage.removeItem(storageKey(user.role));
    window.location.reload();
  }, [user?.role]);
}
