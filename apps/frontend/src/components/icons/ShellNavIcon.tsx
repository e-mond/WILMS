import type { ShellNavIcon as ShellNavIconName } from '@/constants/navigation';
import { cn } from '@/utils/cn';

export interface ShellNavIconProps {
  name: ShellNavIconName;
  className?: string;
}

export function ShellNavIcon({ name, className }: ShellNavIconProps) {
  const iconClass = cn('h-4 w-4 shrink-0', className);

  switch (name) {
    case 'dashboard':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 0h7v7h-7v-7Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'borrowers':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'loans':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M4 12h16M4 17h10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'applications':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M12 11v6M9 14h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'disbursements':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3v14M8 13l4 4 4-4M5 21h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'collections':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 8h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 8V6a4 4 0 0 1 8 0v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'collectors':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'groups':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3 3 7.5 12 12l9-4.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M3 12.5 12 17l9-4.5M3 17.5 12 22l9-4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'risk':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 9v4M12 17h.01"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M10.3 4.5h3.4L21 19H3L10.3 4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'audit':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'reports':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M15 4v3h3M8 12h8M8 16h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'expenses':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 7h10v12H7V7Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M9 5h6a1 1 0 0 1 1 1v1H8V6a1 1 0 0 1 1-1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M10 11h4M10 14h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'settings':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.09V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.09 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.09-.4H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.09-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.09V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.09 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.26.31.45.7.6 1.09.15.39.24.8.24 1.22s-.09.83-.24 1.22a1.7 1.7 0 0 0-.6 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'adjustments':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 7h16M7 12h10M10 17h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'admin-fee':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 8v8M9.5 10.5h3a1.5 1.5 0 0 1 0 3h-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'reconcile':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 7h10v10H7V7Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M4 12h3M17 12h3M12 4v3M12 17v3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'register':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 5v14M5 12h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'queue':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M12 7v5l3 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'offline-sync':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M16 7a4 4 0 0 0-8 0v2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M12 11v6M9 14h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="m4 4 2 2M20 4l-2 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'reviewed':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m9 12 2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'messages':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H9l-5 3v-3.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M8 9.5h8M8 12.5h5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
  }
}
