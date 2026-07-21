import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { completeOnboardingRequest } from '@/lib/auth/authenticate';
import { rejectInvalidCsrf, setCsrfCookie } from '@/lib/auth/csrf-server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';
import { toAuthSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const sessionToken = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!sessionToken) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 422 });
  }

  const payload = body as {
    newPassword?: string;
    displayName?: string;
    phone?: string;
    branch?: string;
    region?: string;
    zone?: string;
  };

  if (!payload.newPassword || payload.newPassword.length < 10) {
    return NextResponse.json(
      { message: 'Password must be at least 10 characters.' },
      { status: 422 },
    );
  }

  const authResult = await completeOnboardingRequest(sessionToken, {
    newPassword: payload.newPassword,
    displayName: payload.displayName,
    phone: payload.phone,
    branch: payload.branch,
    region: payload.region,
    zone: payload.zone,
  });

  if (!authResult || authResult.type !== 'authenticated') {
    return NextResponse.json({ message: 'Unable to complete account setup.' }, { status: 400 });
  }

  const session = toAuthSession(authResult.session);
  const response = NextResponse.json({
    user: session.user,
    expiresAt: session.expiresAt,
  });

  response.cookies.set(
    SESSION_COOKIE_NAME,
    authResult.sessionToken,
    getSessionCookieOptions(),
  );
  setCsrfCookie(response);

  return response;
}
