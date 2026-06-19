import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface DetailSidebarCardProps {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function DetailSidebarCard({
  title,
  subtitle,
  eyebrow,
  children,
  actions,
  className,
}: DetailSidebarCardProps) {
  return (
    <section className={cn('rounded-sm border border-border bg-card p-wilms-4', className)}>
      {eyebrow ? <p className="text-small font-semibold text-executive-gold">{eyebrow}</p> : null}
      {title ? (
        <h2 className="text-heading-2 font-semibold text-text-primary">{title}</h2>
      ) : null}
      {subtitle ? <p className="mt-wilms-1 text-small text-text-muted">{subtitle}</p> : null}
      {children}
      {actions ? <div className="mt-wilms-4 flex flex-wrap gap-wilms-2">{actions}</div> : null}
    </section>
  );
}
