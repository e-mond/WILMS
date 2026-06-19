import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ExecutiveKpiGridProps {
  children: ReactNode;
  className?: string;
}

export function ExecutiveKpiGrid({ children, className }: ExecutiveKpiGridProps) {
  return (
    <div
      className={cn(
        'grid gap-wilms-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
