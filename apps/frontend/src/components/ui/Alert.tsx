import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

const toneClasses = {
  info: 'border-status-info/40 bg-status-info-light text-status-info',
  success: 'border-status-active/40 bg-status-active-light text-status-active',
  warning: 'border-status-at-risk/40 bg-status-at-risk-light text-status-at-risk',
  danger: 'border-danger/40 bg-danger/10 text-danger',
} as const;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: keyof typeof toneClasses;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div
      role="status"
      className={cn('rounded-sm border px-wilms-3 py-wilms-2 text-small', toneClasses[tone], className)}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={cn(title && 'mt-1')}>{children}</div> : null}
    </div>
  );
}
