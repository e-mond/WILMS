import { NextResponse, type NextRequest } from 'next/server';
import { getClearSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/cookies';
import { resolveMiddlewareAuth } from '@/lib/auth/middleware';

export function middleware(request: NextRequest) {
  const result = resolveMiddlewareAuth(request);

  if (result.type === 'redirect') {
    const response = NextResponse.redirect(new URL(result.destination, request.url));

    if (result.clearSession) {
      response.cookies.set(SESSION_COOKIE_NAME, '', getClearSessionCookieOptions());
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|manifest.webmanifest|sw.js|icons/).*)',
  ],
};
