'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export type InputType = 'text' | 'number' | 'date' | 'tel' | 'search' | 'email' | 'password';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: InputType;
  hasError?: boolean;
  className?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = 'text', hasError = false, className, disabled, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      disabled={disabled}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full rounded-sm border bg-card px-wilms-3 text-body text-text-primary placeholder:text-text-muted',
        hasError ? 'border-danger' : 'border-border',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        type === 'search' && 'appearance-none',
        className,
      )}
      {...props}
    />
  );
});
