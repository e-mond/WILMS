'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function AcceptInvitationRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Opening your invitation sign-in...');

  useEffect(() => {
    const email = searchParams.get('email')?.trim() ?? '';
    const token = searchParams.get('token')?.trim() ?? '';
    const loginUrl = new URL('/login', window.location.origin);
    loginUrl.searchParams.set('next', '/complete-profile');

    if (email) {
      loginUrl.searchParams.set('email', email);
    }

    if (!token) {
      setMessage('This invitation link is missing a secure token. Ask an administrator to resend it.');
      return;
    }

    void fetch('/api/wilms/auth/accept-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email: email || undefined }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } }
            | null;
          setMessage(
            payload?.error?.message ??
              'This invitation link is invalid or has expired. Ask an administrator to resend it.',
          );
          return;
        }
        router.replace(`${loginUrl.pathname}${loginUrl.search}`);
      })
      .catch(() => {
        setMessage('Unable to verify the invitation right now. Please try again shortly.');
      });
  }, [router, searchParams]);

  return (
    <div className="w-full max-w-md rounded-sm border border-border bg-card p-wilms-6 text-center">
      <p className="text-body text-text-primary">{message}</p>
    </div>
  );
}
