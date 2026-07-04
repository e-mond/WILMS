'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  hasError?: boolean;
  errorId?: string;
  errorMessage?: string;
  wrapperClassName?: string;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    {
      id,
      label,
      autoComplete = 'current-password',
      hasError = false,
      errorId,
      errorMessage,
      wrapperClassName,
      disabled,
      className,
      ...props
    },
    ref,
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const describedBy = [errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('space-y-wilms-2', wrapperClassName)}>
        <label htmlFor={id} className="text-small font-semibold text-text-primary">
          {label}
        </label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={isVisible ? 'text' : 'password'}
            autoComplete={autoComplete}
            hasError={hasError}
            disabled={disabled}
            aria-describedby={describedBy}
            className={cn('pr-wilms-12', className)}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-pressed={isVisible}
            onClick={() => setIsVisible((visible) => !visible)}
            className="absolute right-wilms-1 top-1/2 -translate-y-1/2"
          >
            {isVisible ? 'Hide password' : 'Show password'}
          </Button>
        </div>
        {errorMessage ? (
          <p id={errorId} className="text-small text-danger">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
