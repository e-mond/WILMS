import { Suspense } from 'react';
import { LoginForm } from '@/features/authentication/components/LoginForm';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AppVersionBadge } from '@/components/layout/AppVersionBadge';

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen flex-col items-center justify-center bg-background p-wilms-4 outline-none"
    >
      <div className="mb-wilms-4 flex w-full max-w-md justify-end">
        <ThemeToggle />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[320px] w-full max-w-md items-center justify-center rounded-sm border border-border bg-card">
            <LoadingSpinner label="Loading sign in" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <AppVersionBadge />
    </main>
  );
}
