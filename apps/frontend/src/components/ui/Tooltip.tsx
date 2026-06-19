'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface TooltipProps {
  content: string;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
  const tooltipId = useId();

  return (
    <span className={cn('group relative inline-flex', className)}>
      <span aria-describedby={tooltipId} className="inline-flex">
        {children}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-wilms-2 hidden w-max max-w-xs -translate-x-1/2 rounded-sm border border-border bg-card px-wilms-2 py-wilms-1 text-small text-text-primary group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
