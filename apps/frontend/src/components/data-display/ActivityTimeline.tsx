import { cn } from '@/utils/cn';

export interface ActivityTimelineEvent {
  id: string;
  message: string;
  recordedAt?: string;
  tone?: 'danger' | 'warning' | 'primary' | 'success' | 'default';
}

export interface ActivityTimelineProps {
  events: ActivityTimelineEvent[];
  className?: string;
  'aria-label'?: string;
}

const DOT_CLASS: Record<NonNullable<ActivityTimelineEvent['tone']>, string> = {
  danger: 'bg-danger',
  warning: 'bg-status-at-risk',
  primary: 'bg-brand-primary',
  success: 'bg-status-active',
  default: 'bg-text-muted',
};

export function ActivityTimeline({
  events,
  className,
  'aria-label': ariaLabel = 'Activity timeline',
}: ActivityTimelineProps) {
  return (
    <ol className={cn('space-y-wilms-3', className)} aria-label={ariaLabel}>
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-wilms-3">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                'mt-1 h-2.5 w-2.5 shrink-0 rounded-full',
                DOT_CLASS[event.tone ?? 'default'],
              )}
              aria-hidden="true"
            />
            {index < events.length - 1 ? (
              <span className="mt-wilms-1 h-full min-h-6 w-px bg-border" aria-hidden="true" />
            ) : null}
          </div>
          <div className="pb-wilms-2">
            <p className="text-body font-semibold text-text-primary">{event.message}</p>
            {event.recordedAt ? (
              <p className="text-small text-text-muted">{event.recordedAt}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
