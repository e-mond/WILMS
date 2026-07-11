'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { Mail } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export interface AuthEmailFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hasError?: boolean;
  errorId?: string;
  errorMessage?: string;
  wrapperClassName?: string;
}

export const AuthEmailField = forwardRef<HTMLInputElement, AuthEmailFieldProps>(
  function AuthEmailField(
    {
      id,
      label = 'Email',
      autoComplete = 'email',
      hasError = false,
      errorId,
      errorMessage,
      wrapperClassName,
      disabled,
      className,
      placeholder = 'name@example.com',
      ...props
    },
    ref,
  ) {
    return (
      <div className={cn('space-y-wilms-2', wrapperClassName)}>
        <label htmlFor={id} className="text-small font-semibold text-text-primary">
          {label}
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute left-wilms-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
            aria-hidden="true"
          />
          <Input
            ref={ref}
            id={id}
            type="email"
            inputMode="email"
            autoComplete={autoComplete}
            placeholder={placeholder}
            hasError={hasError}
            disabled={disabled}
            aria-describedby={errorId || undefined}
            className={cn('pl-10 transition-colors hover:border-text-muted', className)}
            {...props}
          />
        </div>
        {errorMessage ? (
          <p id={errorId} role="alert" className="text-small text-danger">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
