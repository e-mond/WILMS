'use client';

import type { ReactNode } from 'react';
import { useShellPageTitle } from '@/hooks/useShellPageTitle';
import { cn } from '@/utils/cn';

export interface ShellMainLandmarkProps {
  children: ReactNode;
  className?: string;
  'data-executive-content'?: string;
}

export function ShellMainLandmark({
  children,
  className,
  'data-executive-content': dataExecutiveContent,
}: ShellMainLandmarkProps) {
  const pageTitle = useShellPageTitle();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      data-executive-content={dataExecutiveContent}
      className={cn(
        'min-h-screen outline-none bg-background transition-colors',
        className,
      )}
    >
      <h1 className="sr-only">{pageTitle}</h1>
      {children}
    </main>
  );
}
