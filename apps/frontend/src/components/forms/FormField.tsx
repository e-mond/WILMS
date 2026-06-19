import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  error,
  required = false,
  className,
  children,
}: FormFieldProps) {
  const errorId = `${htmlFor}-error`;

  return (
    <div className={cn('space-y-wilms-2', className)}>
      <label htmlFor={htmlFor} className="text-small font-semibold text-text-primary">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
