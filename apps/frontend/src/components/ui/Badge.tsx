import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { STATUS_TOKEN_CLASSES, type StatusTokenKey } from '@/constants/design-tokens';

const badgeVariants = {
  default: 'bg-background text-text-primary border-border',
  primary: 'bg-brand-primary-light text-brand-primary border-brand-primary',
  success: `${STATUS_TOKEN_CLASSES.active.bg} ${STATUS_TOKEN_CLASSES.active.text} ${STATUS_TOKEN_CLASSES.active.border}`,
  warning: `${STATUS_TOKEN_CLASSES.atRisk.bg} ${STATUS_TOKEN_CLASSES.atRisk.text} ${STATUS_TOKEN_CLASSES.atRisk.border}`,
  danger: `${STATUS_TOKEN_CLASSES.defaulted.bg} ${STATUS_TOKEN_CLASSES.defaulted.text} ${STATUS_TOKEN_CLASSES.defaulted.border}`,
  pending: `${STATUS_TOKEN_CLASSES.pending.bg} ${STATUS_TOKEN_CLASSES.pending.text} ${STATUS_TOKEN_CLASSES.pending.border}`,
  blacklisted: `${STATUS_TOKEN_CLASSES.blacklisted.bg} ${STATUS_TOKEN_CLASSES.blacklisted.text} ${STATUS_TOKEN_CLASSES.blacklisted.border}`,
} as const;

export type BadgeVariant = keyof typeof badgeVariants;

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  statusToken?: StatusTokenKey;
  className?: string;
}

export function Badge({
  children,
  variant = 'default',
  statusToken,
  className,
}: BadgeProps) {
  const statusClasses = statusToken
    ? `${STATUS_TOKEN_CLASSES[statusToken].bg} ${STATUS_TOKEN_CLASSES[statusToken].text} ${STATUS_TOKEN_CLASSES[statusToken].border}`
    : badgeVariants[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-wilms-2 py-wilms-1 text-small font-semibold',
        statusClasses,
        className,
      )}
    >
      {children}
    </span>
  );
}
