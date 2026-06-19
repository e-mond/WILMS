import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  className?: string;
}

export function StatCard({ label, value, className }: StatCardProps) {
  return (
    <div className={cn('rounded-sm border border-border bg-card p-wilms-4', className)}>
      <p className="text-small font-semibold text-text-muted">{label}</p>
      <div className="mt-wilms-2 text-heading-2 font-semibold text-text-primary">{value}</div>
    </div>
  );
}
