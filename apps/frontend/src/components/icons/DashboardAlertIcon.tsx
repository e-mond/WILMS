import type { DashboardAlertIcon as DashboardAlertIconName } from '@/types/dashboard';
import { cn } from '@/utils/cn';

export interface DashboardAlertIconProps {
  icon: DashboardAlertIconName;
  className?: string;
}

export function DashboardAlertIcon({ icon, className }: DashboardAlertIconProps) {
  const baseClass = cn('mt-0.5 h-5 w-5 shrink-0', className);

  switch (icon) {
    case 'danger':
      return (
        <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-danger" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      );
    case 'warning':
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
    case 'edit':
      return (
        <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-brand-primary" fill="none">
            <path
              d="M12.5 3.5 16.5 7.5 7 17H3v-4l9.5-9.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      );
    case 'info':
    default:
      return (
        <span className={cn(baseClass, 'inline-flex items-center justify-center')} aria-hidden="true">
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-status-info" fill="none">
            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10 9v5M10 6.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      );
  }
}
