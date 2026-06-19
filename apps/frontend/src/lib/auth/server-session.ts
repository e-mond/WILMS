import { cookies } from 'next/headers';
import { parseSessionCookie, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { AuthSession } from '@/types/auth';

export function getServerSession(): AuthSession | null {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return parseSessionCookie(sessionCookie?.value);
}
