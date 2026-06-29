import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, getCsrfCookieOptions } from '@/lib/auth/csrf';
import { generateCsrfToken } from '@/lib/auth/csrf-token';

export function setCsrfCookie(response: NextResponse, token = generateCsrfToken()): string {
  response.cookies.set(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
}

export function rejectInvalidCsrf(request: Request): NextResponse | null {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const header = request.headers.get(CSRF_HEADER_NAME)?.trim();
  const cookie = cookies().get(CSRF_COOKIE_NAME)?.value;

  if (!header || !cookie || header !== cookie) {
    return NextResponse.json({ message: 'Invalid CSRF token.' }, { status: 403 });
  }

  return null;
}
