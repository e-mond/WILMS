import { NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/auth/csrf-token';
import { getCsrfCookieOptions, CSRF_COOKIE_NAME } from '@/lib/auth/csrf';

export async function GET() {
  const token = generateCsrfToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return response;
}
