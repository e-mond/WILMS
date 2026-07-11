import { Suspense } from 'react';
import { ResetPasswordForm } from '@/features/authentication/components/ResetPasswordForm';
import { AuthPageShell } from '@/features/authentication/components/AuthPageShell';
import { AuthCard } from '@/features/authentication/components/AuthCard';
import { Skeleton } from '@/components/feedback/Skeleton';

function ResetPasswordFallback() {
  return (
    <AuthCard aria-busy="true" aria-label="Loading reset password">
      <div className="space-y-wilms-4">
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthPageShell helpHref="/login" helpLabel="Sign in">
      <Suspense fallback={<ResetPasswordFallback />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthPageShell>
  );
}
