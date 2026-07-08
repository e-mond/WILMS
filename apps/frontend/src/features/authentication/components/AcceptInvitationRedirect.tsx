'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AcceptInvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get('email')?.trim();
    const loginUrl = new URL('/login', window.location.origin);
    loginUrl.searchParams.set('next', '/complete-profile');

    if (email) {
      loginUrl.searchParams.set('email', email);
    }

    router.replace(`${loginUrl.pathname}${loginUrl.search}`);
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md rounded-sm border border-border bg-card p-wilms-6 text-center">
      <p className="text-body text-text-primary">Opening your invitation sign-in...</p>
    </div>
  );
}
