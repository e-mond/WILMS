import { Suspense } from 'react';
import { LoginForm } from '@/features/authentication/components/LoginForm';
import { AuthPageShell } from '@/features/authentication/components/AuthPageShell';
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
    <AuthPageShell>
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthPageShell>
  );
}
