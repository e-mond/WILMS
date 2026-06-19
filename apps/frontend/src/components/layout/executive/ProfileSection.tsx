import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ProfileSectionProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ProfileSection({ title, children, actions, className }: ProfileSectionProps) {
  return (
    <section className={cn('rounded-sm border border-border bg-card p-wilms-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-wilms-3">
        <h2 className="text-heading-2 font-semibold text-text-primary">{title}</h2>
        {actions}
      </div>
      <div className="mt-wilms-4">{children}</div>
    </section>
  );
}

export interface ProfileFieldGridProps {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3 | 4;
}

export function ProfileFieldGrid({ items, columns = 2 }: ProfileFieldGridProps) {
  return (
    <dl
      className={cn(
        'grid gap-wilms-4',
        columns === 2 && 'md:grid-cols-2',
        columns === 3 && 'md:grid-cols-3',
        columns === 4 && 'md:grid-cols-2 xl:grid-cols-4',
      )}
    >
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-small font-semibold text-text-muted">{item.label}</dt>
          <dd className="mt-wilms-1 text-body text-text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
