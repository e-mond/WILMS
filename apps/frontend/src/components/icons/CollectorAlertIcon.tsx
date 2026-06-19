import type { CollectorAlert } from '@/types/collector-management';
import { cn } from '@/utils/cn';

export interface CollectorAlertIconProps {
  severity: CollectorAlert['severity'];
  className?: string;
}

export function CollectorAlertIcon({ severity, className }: CollectorAlertIconProps) {
  const baseClass = cn('mt-0.5 h-5 w-5 shrink-0', className);

  if (severity === 'danger') {
    return (
      <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-danger" fill="none">
          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  if (severity === 'warning') {
    return (
      <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
        <svg viewBox="0 0 20 20" className="h-5 w-5 text-status-at-risk" fill="none">
          <path
            d="M10 3.5 17 16.5H3L10 3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M10 8v4M10 14.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
      <svg viewBox="0 0 20 20" className="h-5 w-5 text-status-active" fill="none">
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10.5 9 12.5 13.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}
