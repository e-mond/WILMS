import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface AuthCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className, ...props }: AuthCardProps) {
  return (
    <section
      {...props}
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-card shadow-auth-card',
        className,
      )}
    >
      <div className="h-0.5 bg-executive-gold" aria-hidden="true" />
      <div className="p-wilms-6 sm:p-wilms-8">{children}</div>
    </section>
  );
}
