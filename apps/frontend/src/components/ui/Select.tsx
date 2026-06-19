'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { hasError = false, className, disabled, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      disabled={disabled}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full rounded-sm border bg-card px-wilms-3 text-body text-text-primary',
        hasError ? 'border-danger' : 'border-border',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
