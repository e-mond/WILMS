import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type CollectorsKpiIconName =
  | 'total-collectors'
  | 'avg-rate'
  | 'below-seventy'
  | 'active-today';

export interface CollectorsKpiIconProps {
  name: CollectorsKpiIconName;
  className?: string;
}

export function CollectorsKpiIcon({ name, className }: CollectorsKpiIconProps) {
  const iconClass = cn('h-5 w-5 shrink-0 text-text-muted', className);

  const icons: Record<CollectorsKpiIconName, ReactNode> = {
    'total-collectors': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    'avg-rate': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M6 16l4-6 4 3 5-8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    'below-seventy': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3.5 20 18.5H4L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 9v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'active-today': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 21s-7-4.5-7-10a7 7 0 1 1 14 0c0 5.5-7 10-7 10Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="11" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };

  return icons[name];
}
