import { cn } from '@/utils/cn';

export interface NotificationBellIconProps {
  className?: string;
}

export function NotificationBellIcon({ className }: NotificationBellIconProps) {
  return (
    <svg
      className={cn('h-4 w-4', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3a5 5 0 0 1 5 5v2.5c0 .7.3 1.4.8 1.9L19 14H5l1.2-1.6c.5-.5.8-1.2.8-1.9V8a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
