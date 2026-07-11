import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

const variantClasses = {
  info: 'border-brand-primary bg-brand-primary-light text-text-primary',
  success: 'border-success bg-success-light text-text-primary',
  warning: 'border-warning bg-warning-light text-text-primary',
  error: 'border-danger bg-danger-light text-text-primary',
} as const;

export type AlertVariant = keyof typeof variantClasses;

export interface AlertProps {
  title: string;
  children?: ReactNode;
  variant?: AlertVariant;
  className?: string;
  id?: string;
}

export function Alert({
  title,
  children,
  variant = 'info',
  className,
  id,
}: AlertProps) {
  return (
    <div
      id={id}
      role="alert"
      className={cn(
        'rounded-sm border p-wilms-4',
        variantClasses[variant],
        className,
      )}
    >
      <p className="text-heading-3 font-semibold">{title}</p>
      {children ? <div className="mt-wilms-2 text-body">{children}</div> : null}
    </div>
  );
}
