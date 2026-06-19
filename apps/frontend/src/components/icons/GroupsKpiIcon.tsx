import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type GroupsKpiIconName =
  | 'active-groups'
  | 'total-members'
  | 'flagged-suspended'
  | 'avg-rate';

export interface GroupsKpiIconProps {
  name: GroupsKpiIconName;
  className?: string;
}

export function GroupsKpiIcon({ name, className }: GroupsKpiIconProps) {
  const iconClass = cn('h-5 w-5 shrink-0 text-text-muted', className);

  const icons: Record<GroupsKpiIconName, ReactNode> = {
    'active-groups': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M7 8.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M4.5 18c0-2.8 2.4-4.5 5.5-4.5s5.5 1.7 5.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M15.5 9.5a2.5 2.5 0 1 1 5 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14.5 18c.2-2.2 2.2-3.5 4.5-3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    'total-members': (
      <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16.5" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4.5 18.5c0-2.8 2.2-4.5 4.5-4.5s4.5 1.7 4.5 4.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 18.5c.2-2 1.8-3.2 3.5-3.2"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    'flagged-suspended': (
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
  };

  return icons[name];
}
