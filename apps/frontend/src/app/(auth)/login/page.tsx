import { Suspense } from 'react';
import { LoginForm } from '@/features/authentication/components/LoginForm';
import { AuthBrandHeader } from '@/features/authentication/components/AuthBrandHeader';
import { AuthPageFooter } from '@/features/authentication/components/AuthPageFooter';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { Skeleton } from '@/components/feedback/Skeleton';

function LoginFormFallback() {
  return (
    <AuthCard aria-busy="true" aria-label="Loading sign in">
      <div className="space-y-wilms-4">
        <Skeleton className="mx-auto h-7 w-40" />
        <Skeleton className="mx-auto h-4 w-56" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-dvh flex-col items-center justify-center bg-background px-wilms-4 py-wilms-8 outline-none"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.08),_transparent_60%)] motion-reduce:bg-none"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-[440px] flex-col gap-wilms-6">
        <AuthBrandHeader />

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <AuthPageFooter />
      </div>
    </main>
  );
}
