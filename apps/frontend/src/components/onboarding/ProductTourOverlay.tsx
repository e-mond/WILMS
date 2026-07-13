'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLE, type UserRole } from '@/constants/roles';
import { cn } from '@/utils/cn';

const TOUR_STORAGE_PREFIX = 'wilms-product-tour-completed';

export interface ProductTourStep {
  id: string;
  title: string;
  body: string;
}

const TOUR_STEPS_BY_ROLE: Partial<Record<UserRole, ProductTourStep[]>> = {
  [USER_ROLE.SUPER_ADMIN]: [
    {
      id: 'dashboard',
      title: 'Executive dashboard',
      body: 'Review pool funds, disbursements, collections, and outstanding balances. Switch between KPI cards and charts in Financial Overview.',
    },
    {
      id: 'collections',
      title: 'Collections & reconciliation',
      body: 'Use Daily Collection to track expected vs collected variance and review flagged reconciliations.',
    },
    {
      id: 'loan-pools',
      title: 'Loan pools',
      body: 'Monitor capital utilisation, disbursements, and repayment rates for each regional pool.',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      body: 'Watch the bell icon for reconciliation alerts, messages, and system events. Enable sounds in settings.',
    },
  ],
  [USER_ROLE.COLLECTOR]: [
    {
      id: 'collector-dashboard',
      title: 'Field dashboard',
      body: 'See today’s groups, expected collections, and record payments from assigned borrowers.',
    },
    {
      id: 'collector-messages',
      title: 'Supervisor messages',
      body: 'Read and reply to administrator messages from the Messages inbox.',
    },
    {
      id: 'collector-reconcile',
      title: 'End-of-day reconciliation',
      body: 'Submit physical cash counts. Flagged variance triggers supervisor review.',
    },
  ],
  [USER_ROLE.REGISTRATION_OFFICER]: [
    {
      id: 'register',
      title: 'Register borrowers',
      body: 'Complete the guided registration wizard with photos, ID documents, and GPS verification.',
    },
    {
      id: 'my-registrations',
      title: 'Track submissions',
      body: 'Monitor pending, approved, and rejected registrations from My Registrations.',
    },
  ],
  [USER_ROLE.APPROVER]: [
    {
      id: 'pending-queue',
      title: 'Approval queue',
      body: 'Review borrower applications, ID documents, and guarantor details before approving.',
    },
  ],
  [USER_ROLE.AUDITOR]: [
    {
      id: 'reports',
      title: 'Read-only reports',
      body: 'Access financial and operational reports without mutation permissions.',
    },
  ],
};

function storageKey(role: UserRole): string {
  return `${TOUR_STORAGE_PREFIX}:${role}`;
}

export function useProductTour() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role;
  const steps = role ? TOUR_STEPS_BY_ROLE[role] ?? [] : [];
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
