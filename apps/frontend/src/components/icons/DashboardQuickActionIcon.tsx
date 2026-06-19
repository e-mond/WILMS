import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type DashboardQuickActionIconName = 'approve' | 'variance' | 'audit';

export interface DashboardQuickActionIconProps {
  name: DashboardQuickActionIconName;
  className?: string;
}

export function DashboardQuickActionIcon({ name, className }: DashboardQuickActionIconProps) {
  const iconClass = cn('h-4 w-4 shrink-0', className);

  const icons: Record<DashboardQuickActionIconName, ReactNode> = {
    approve: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 12l4 4L19 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    variance: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18V6M10 18V10M16 18v-8M20 18V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    audit: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  };

  return icons[name];
}
