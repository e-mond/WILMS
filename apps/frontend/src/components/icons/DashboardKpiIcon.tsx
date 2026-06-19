import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type DashboardKpiIconName = 'pool' | 'disbursed' | 'collected' | 'outstanding';

export interface DashboardKpiIconProps {
  name: DashboardKpiIconName;
  className?: string;
}

export function DashboardKpiIcon({ name, className }: DashboardKpiIconProps) {
  const iconClass = cn('h-5 w-5 shrink-0 text-text-muted', className);

  const icons: Record<DashboardKpiIconName, ReactNode> = {
    pool: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    disbursed: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 4v12M12 16l-4-4M12 16l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    collected: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 20V8M12 8l-4 4M12 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 4h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    outstanding: (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  };

  return icons[name];
}
