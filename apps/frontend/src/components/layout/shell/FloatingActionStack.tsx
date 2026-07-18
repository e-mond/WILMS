'use client';

import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * Shared bottom-right floating region so Help, connectivity, and context
 * triggers never independently collide.
 */
export function FloatingActionStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-floating-action-stack="true"
      className={cn(
        'pointer-events-none fixed z-[90] flex flex-col-reverse items-end gap-3',
        'bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]',
        'md:bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:right-[max(1.25rem,env(safe-area-inset-right))]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FloatingActionSlot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('pointer-events-auto', className)}>{children}</div>;
}
