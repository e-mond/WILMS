import Link from 'next/link';
import { Alert } from '@/components/feedback/Alert';
import { resolveLoginReturnUrl } from '@/lib/auth/session-expiry';

interface SessionExpiredPageProps {
  searchParams?: {
    next?: string;
  };
}

export default function SessionExpiredPage({ searchParams }: SessionExpiredPageProps) {
  const loginHref = resolveLoginReturnUrl(searchParams?.next);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex min-h-screen items-center justify-center bg-background p-wilms-4 outline-none"
    >
      <div className="w-full max-w-md space-y-wilms-4 rounded-sm border border-border bg-card p-wilms-6">
        <div className="text-center">
          <h1 className="text-heading-1 font-semibold text-text-primary">Session expired</h1>
          <p className="mt-wilms-2 text-body text-text-muted">
            Your session has ended for security reasons. Sign in again to continue working in
            WILMS.
          </p>
        </div>

        <Alert title="You have been signed out" variant="warning">
          Unsaved offline payments remain on this device and will sync after you sign back in.
        </Alert>

        <Link
          href={loginHref}
          className="inline-flex h-10 w-full items-center justify-center rounded-sm border border-brand-primary bg-brand-primary px-wilms-4 text-body font-semibold text-card hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  );
}
