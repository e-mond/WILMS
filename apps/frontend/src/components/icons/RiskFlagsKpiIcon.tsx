import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type RiskFlagsKpiIconName = 'open-flags' | 'blacklisted' | 'arrears' | 'high-risk';

export interface RiskFlagsKpiIconProps {
  name: RiskFlagsKpiIconName;
  className?: string;
}

export function RiskFlagsKpiIcon({ name, className }: RiskFlagsKpiIconProps) {
  const iconClass = cn('h-5 w-5 shrink-0 text-text-muted', className);

  const icons: Record<RiskFlagsKpiIconName, ReactNode> = {
    'open-flags': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 4v16M5 4h11l-2 3 2 3H5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
    blacklisted: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    arrears: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.5 20 18.5H4L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M12 9v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    'high-risk': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l9 18H3L12 2Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 9v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[name];
}
