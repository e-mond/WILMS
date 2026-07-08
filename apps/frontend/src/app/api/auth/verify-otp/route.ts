import { NextResponse } from 'next/server';
import { verifyOtpCredentials } from '@/lib/auth/authenticate';
import { rejectInvalidCsrf, setCsrfCookie } from '@/lib/auth/csrf-server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';
import { toAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 422 });
  }

  const challengeId =
    body && typeof body === 'object' && typeof (body as { challengeId?: unknown }).challengeId === 'string'
      ? (body as { challengeId: string }).challengeId
      : '';
  const code =
    body && typeof body === 'object' && typeof (body as { code?: unknown }).code === 'string'
      ? (body as { code: string }).code
      : '';

  if (!challengeId || !code.trim()) {
    return NextResponse.json({ message: 'Verification code is required.' }, { status: 422 });
  }

  const authResult = await verifyOtpCredentials({ challengeId, code });

  if (!authResult || authResult.type !== 'authenticated') {
    return NextResponse.json({ message: 'Invalid or expired verification code.' }, { status: 401 });
  }

  const session = toAuthSession(authResult.session);
  const response = NextResponse.json({
    user: session.user,
    expiresAt: session.expiresAt,
    mustCompleteOnboarding: authResult.mustCompleteOnboarding ?? false,
  });

  response.cookies.set(
    SESSION_COOKIE_NAME,
    authResult.sessionToken,
    getSessionCookieOptions(),
  );
  setCsrfCookie(response);

  return response;
}
