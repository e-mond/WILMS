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
}

export function TimelineStepper({ steps, className }: TimelineStepperProps) {
  return (
    <ol className={cn('space-y-wilms-3', className)} aria-label="Flag timeline">
      {steps.map((step, index) => (
        <li key={step.id} className="flex gap-wilms-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full border text-small font-bold',
                step.state === 'complete' && 'border-status-active bg-status-active-light text-status-active',
                step.state === 'current' && 'border-brand-primary bg-brand-primary-light text-brand-primary',
                step.state === 'upcoming' && 'border-border bg-background text-text-muted',
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span className="mt-wilms-1 h-full min-h-6 w-px bg-border" aria-hidden="true" />
            ) : null}
          </div>
          <div className="pb-wilms-2">
            <p className="text-body font-semibold text-text-primary">{step.label}</p>
            {step.detail ? <p className="text-small text-text-muted">{step.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
