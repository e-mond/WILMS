'use client';

import { usePathname } from 'next/navigation';
import { PUBLIC_PATHS } from '@/lib/auth/routes';

const AUTH_CHROME_PATHS = new Set([
  '/login',
  '/forgot-password',
  '/reset-password',
  '/session-expired',
  '/accept-invitation',
  '/complete-profile',
]);

export function useIsAuthRoute(): boolean {
  const pathname = usePathname();

  if (!pathname) {
    return false;
  }

  if (AUTH_CHROME_PATHS.has(pathname)) {
    return true;
  }

  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
