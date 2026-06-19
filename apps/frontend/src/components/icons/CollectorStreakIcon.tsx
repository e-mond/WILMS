import { cn } from '@/utils/cn';

export interface CollectorStreakIconProps {
  className?: string;
}

export function CollectorStreakIcon({ className }: CollectorStreakIconProps) {
  return (
    <svg
      className={cn('h-4 w-4 shrink-0 text-executive-gold', className)}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 3c0 2.5-2 4-2 6.5a2 2 0 0 0 4 0C12 7 10 5.5 10 3Z"
        fill="currentColor"
      />
      <path
        d="M7.5 11.5c-1.5 1-2 2.5-2 4.5h9c0-2-.5-3.5-2-4.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
    </svg>
  );
}
