import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface ExecutiveDetailLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function ExecutiveDetailLayout({
  children,
  sidebar,
  className,
}: ExecutiveDetailLayoutProps) {
  return (
    <div className={cn('grid gap-wilms-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]', className)}>
      <div className="min-w-0 space-y-wilms-4">{children}</div>

      {/*
        Sticky sidebar: stays anchored below the navbar as the main content scrolls.
        - `top-[var(--navbar-height,56px)]` — matches your navbar offset (same var as the drawer).
        - `max-h-[calc(100vh-var(--navbar-height,56px))]` — caps height to the visible viewport below the nav.
        - `overflow-y-auto` — sidebar itself scrolls if its content exceeds that height.
        - `self-start` — prevents the aside from stretching to the grid row height, which would break sticky.
      */}
      <aside className={cn(
        'min-w-0 space-y-wilms-4',
        'xl:self-start xl:sticky xl:top-[var(--navbar-height,56px)]',
        'xl:max-h-[calc(100vh-var(--navbar-height,56px))] xl:overflow-y-auto',
      )}>
        {sidebar}
      </aside>
    </div>
  );
}