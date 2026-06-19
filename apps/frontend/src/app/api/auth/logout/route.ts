import { NextResponse } from 'next/server';
import { getClearSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
  return response;
}
