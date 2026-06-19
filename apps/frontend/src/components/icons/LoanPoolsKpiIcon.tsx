import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type LoanPoolsKpiIconName =
  | 'pool-funds'
  | 'active-pools'
  | 'disbursed'
  | 'outstanding';

export interface LoanPoolsKpiIconProps {
  name: LoanPoolsKpiIconName;
  className?: string;
}

export function LoanPoolsKpiIcon({ name, className }: LoanPoolsKpiIconProps) {
  const iconClass = cn('h-5 w-5 shrink-0 text-text-muted', className);

  const icons: Record<LoanPoolsKpiIconName, ReactNode> = {
    'pool-funds': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="7" width="18" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 11v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'active-pools': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 7h16M4 12h16M4 17h10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="18.5" cy="17" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    disbursed: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path
          d="M7 15l4-5 3 3 6-8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    outstanding: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[name];
}
