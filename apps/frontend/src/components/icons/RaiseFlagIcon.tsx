import type { SVGProps } from 'react';
import { cn } from '@/utils/cn';

export function RaiseFlagIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('h-4 w-4', className)}
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
