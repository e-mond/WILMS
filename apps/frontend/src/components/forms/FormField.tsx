import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  hint?: string;
  characterCount?: { current: number; max: number };
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  hint,
  characterCount,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const countId = characterCount ? `${htmlFor}-count` : undefined;
  const describedBy = [error ? errorId : null, hintId, countId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('space-y-wilms-2', className)}>
      <label htmlFor={htmlFor} className="text-small font-semibold text-text-primary">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-small text-text-muted">
          {hint}
        </p>
      ) : null}
      <div aria-describedby={describedBy}>{children}</div>
      {characterCount ? (
        <p
          id={countId}
          className={cn(
            'text-right text-small',
            characterCount.current > characterCount.max ? 'text-danger' : 'text-text-muted',
          )}
          aria-live="polite"
        >
          {characterCount.current}/{characterCount.max}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
