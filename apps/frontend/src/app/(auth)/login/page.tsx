import { Suspense } from 'react';
import { LoginForm } from '@/features/authentication/components/LoginForm';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AppVersionBadge } from '@/components/layout/AppVersionBadge';
import { WilmsBrandMark } from '@/components/icons/WilmsBrandMark';

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-wilms-4 outline-none"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(34,139,34,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(212,175,55,0.1),_transparent_50%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 mb-wilms-6 flex w-full max-w-md items-center justify-between">
        <WilmsBrandMark roleLabel="Loan Management" />
        <ThemeToggle />
      </div>

      <Suspense
        fallback={
          <div className="relative z-10 flex min-h-[360px] w-full max-w-md items-center justify-center rounded-sm border border-border bg-card/90 backdrop-blur-sm">
            <LoadingSpinner label="Loading sign in" />
          </div>
        }
      >
        <div className="relative z-10 w-full max-w-md">
          <LoginForm />
        </div>
      </Suspense>

      <div className="relative z-10 mt-wilms-4">
        <AppVersionBadge />
      </div>
    </main>
  );
}
