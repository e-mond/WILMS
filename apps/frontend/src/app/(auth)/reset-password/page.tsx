import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/authentication/components/ResetPasswordForm';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function ResetPasswordPage() {
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
            <LoadingSpinner label="Loading" />
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
