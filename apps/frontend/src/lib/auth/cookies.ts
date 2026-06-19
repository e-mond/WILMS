import { SESSION_COOKIE_NAME } from '@/lib/auth/session';

const ONE_DAY_SECONDS = 60 * 60 * 24;

export interface SessionCookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
}

export function getSessionCookieOptions(maxAgeSeconds = ONE_DAY_SECONDS): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

export function getClearSessionCookieOptions(): SessionCookieOptions {
  return {
    ...getSessionCookieOptions(0),
    maxAge: 0,
  };
}

export { SESSION_COOKIE_NAME };
