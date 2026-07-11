import type { ReactNode } from 'react';
import { AuthBrandHeader } from '@/features/authentication/components/AuthBrandHeader';
import { AuthPageFooter } from '@/features/authentication/components/AuthPageFooter';
import { cn } from '@/utils/cn';

export interface AuthPageShellProps {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  helpHref?: string;
  helpLabel?: string;
}

export function AuthPageShell({
  children,
  className,
  contentClassName,
  helpHref,
  helpLabel,
}: AuthPageShellProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={cn(
        'relative flex min-h-dvh flex-col items-center justify-center bg-background px-wilms-4 py-wilms-8 outline-none',
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)] motion-reduce:bg-none"
        aria-hidden="true"
      />

      <div
        className={cn(
          'relative z-10 flex w-full max-w-[440px] flex-col',
          contentClassName,
        )}
      >
        <AuthBrandHeader className="mb-wilms-8 lg:mb-10" />
        {children}
        <AuthPageFooter className="mt-wilms-6" helpHref={helpHref} helpLabel={helpLabel} />
      </div>
    </main>
  );
}
