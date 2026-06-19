import type { ReactNode } from 'react';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { Button } from '@/components/ui/Button';
import type { PermissionId } from '@/constants/permissions';
import { cn } from '@/utils/cn';

export interface MultiStepFormStep {
  id: string;
  title: string;
}

export interface MultiStepFormProps {
  steps: MultiStepFormStep[];
  currentStep: number;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  /** When set, final submit requires any of these permissions. */
  submitPermissions?: PermissionId[];
  className?: string;
  /** When true, progress shows only completed + current steps (hides future step titles). */
  hideFutureSteps?: boolean;
}

export function MultiStepForm({
  steps,
  currentStep,
  children,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  nextLabel = 'Continue',
  submitLabel = 'Submit registration',
  submitPermissions,
  className,
  hideFutureSteps = false,
}: MultiStepFormProps) {
  const isFirstStep = currentStep === 0;
  const isReviewStep = currentStep === steps.length - 1;
  const visibleSteps = hideFutureSteps ? steps.slice(0, currentStep + 1) : steps;

  const submitButton = (
    <Button type="button" onClick={onSubmit} disabled={isSubmitting}>
      {isSubmitting ? 'Submitting...' : submitLabel}
    </Button>
  );

  return (
    <div className={cn('space-y-wilms-6', className)}>
      <ol
        aria-label="Registration progress"
        className={cn(
          'grid gap-wilms-2',
          hideFutureSteps
            ? visibleSteps.length <= 3
              ? 'sm:grid-cols-3'
              : 'sm:grid-cols-3 lg:grid-cols-6'
            : 'sm:grid-cols-3 lg:grid-cols-6',
        )}
      >
        {visibleSteps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;

          return (
            <li
              key={step.id}
              aria-current={isActive ? 'step' : undefined}
              className={cn(
                'rounded-sm border px-wilms-3 py-wilms-2 text-small font-semibold',
                isActive
                  ? 'border-brand-primary bg-brand-primary-light text-brand-primary'
                  : isComplete
                    ? 'border-success bg-success-light text-text-primary'
                    : 'border-border bg-card text-text-muted',
              )}
            >
              <span className="block text-small text-text-muted">Step {index + 1}</span>
              {step.title}
            </li>
          );
        })}
      </ol>

      <div>{children}</div>

      <div className="flex flex-wrap gap-wilms-3">
        {!isFirstStep ? (
          <Button type="button" variant="secondary" onClick={onBack} disabled={isSubmitting}>
            Back
          </Button>
        ) : null}

        {isReviewStep ? (
          submitPermissions?.length ? (
            <PermissionGate permissions={submitPermissions}>{submitButton}</PermissionGate>
          ) : (
            submitButton
          )
        ) : (
          <Button type="button" onClick={onNext} disabled={isSubmitting}>
            {nextLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
