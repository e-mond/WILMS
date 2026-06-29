import { NextResponse } from 'next/server';
import { rejectInvalidCsrf } from '@/lib/auth/csrf-server';
import { getClearSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';

export async function POST(request: Request) {
  const csrfFailure = rejectInvalidCsrf(request);
  if (csrfFailure) {
    return csrfFailure;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
  return response;
}
