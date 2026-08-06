import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface TimelineStep {
  id: string;
  label: string;
  detail?: string;
  state: 'complete' | 'current' | 'upcoming';
}

export interface TimelineStepperProps {
  steps: readonly TimelineStep[];
  className?: string;
  /** Horizontal progress strip above the vertical detail list (loan / registration workflows). */
  showProgressTrack?: boolean;
}

export function TimelineStepper({
  steps,
  className,
  showProgressTrack = true,
}: TimelineStepperProps) {
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.state === 'current'),
  );
  const completedCount = steps.filter((step) => step.state === 'complete').length;
  const progressPercent =
    steps.length === 0 ? 0 : Math.round(((completedCount + (currentIndex >= 0 ? 0.5 : 0)) / steps.length) * 100);

  return (
    <div className={cn('space-y-wilms-4', className)}>
      {showProgressTrack ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-background"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Workflow progress"
        >
          <div
            className="h-full rounded-full bg-brand-primary motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      ) : null}
      <ol className="space-y-wilms-3" aria-label="Workflow timeline">
        {steps.map((step, index) => (
          <li key={step.id} className="flex gap-wilms-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border text-small font-bold',
                  step.state === 'complete' &&
                    'border-status-active bg-status-active-light text-status-active',
                  step.state === 'current' &&
                    'border-brand-primary bg-brand-primary-light text-brand-primary ring-2 ring-brand-primary/20',
                  step.state === 'upcoming' && 'border-border bg-background text-text-muted',
                )}
                aria-current={step.state === 'current' ? 'step' : undefined}
                aria-hidden="true"
              >
                {step.state === 'complete' ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              {index < steps.length - 1 ? (
                <span className="mt-wilms-1 h-full min-h-6 w-px bg-border" aria-hidden="true" />
              ) : null}
            </div>
            <div className="pb-wilms-2">
              <p
                className={cn(
                  'text-body font-semibold',
                  step.state === 'upcoming' ? 'text-text-muted' : 'text-text-primary',
                )}
              >
                {step.label}
              </p>
              {step.detail ? <p className="text-small text-text-muted">{step.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
