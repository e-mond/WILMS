'use client';

import { forwardRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export interface PasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  labelAction?: React.ReactNode;
  hasError?: boolean;
  errorId?: string;
  errorMessage?: string;
  capsLockWarning?: boolean;
  wrapperClassName?: string;
  onCapsLockKeyEvent?: (event: KeyboardEvent<HTMLInputElement>) => void;
  onCapsLockBlur?: () => void;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField(
    {
      id,
      label,
      labelAction,
      autoComplete = 'current-password',
      hasError = false,
      errorId,
      errorMessage,
      capsLockWarning = false,
      wrapperClassName,
      disabled,
      className,
      onCapsLockKeyEvent,
      onCapsLockBlur,
      onKeyUp,
      onKeyDown,
      onBlur,
      ...props
    },
    ref,
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const describedBy = [errorId, capsLockWarning ? `${id}-capslock` : undefined]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={cn('space-y-wilms-2', wrapperClassName)}>
        <div className="flex items-center justify-between gap-wilms-2">
          <label htmlFor={id} className="text-small font-semibold text-text-primary">
            {label}
          </label>
          {labelAction}
        </div>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            type={isVisible ? 'text' : 'password'}
            autoComplete={autoComplete}
            hasError={hasError}
            disabled={disabled}
            aria-describedby={describedBy || undefined}
            className={cn('pr-11', className)}
            onKeyUp={(event) => {
              onCapsLockKeyEvent?.(event);
              onKeyUp?.(event);
            }}
            onKeyDown={(event) => {
              onCapsLockKeyEvent?.(event);
              onKeyDown?.(event);
            }}
            onBlur={(event) => {
              onCapsLockBlur?.();
              onBlur?.(event);
            }}
            {...props}
          />
          <button
            type="button"
            disabled={disabled}
            aria-pressed={isVisible}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            onClick={() => setIsVisible((visible) => !visible)}
            className="absolute right-0 top-0 inline-flex h-10 w-11 items-center justify-center rounded-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVisible ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {capsLockWarning ? (
          <p id={`${id}-capslock`} role="status" className="text-small text-warning">
            Caps Lock is on.
          </p>
        ) : null}
        {errorMessage ? (
          <p id={errorId} role="alert" className="text-small text-danger">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  },
);
