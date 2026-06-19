import { isPublicPath } from '@/lib/auth/routes';

export const SESSION_EXPIRED_PATH = '/session-expired';

export function buildSessionExpiredUrl(nextPath?: string | null): string {
  if (
    !nextPath ||
    !nextPath.startsWith('/') ||
    nextPath.startsWith('//') ||
    isPublicPath(nextPath)
  ) {
    return SESSION_EXPIRED_PATH;
  }

  return `${SESSION_EXPIRED_PATH}?next=${encodeURIComponent(nextPath)}`;
}

export function resolveLoginReturnUrl(nextPath?: string | null): string {
  if (
    !nextPath ||
    !nextPath.startsWith('/') ||
    nextPath.startsWith('//') ||
    isPublicPath(nextPath)
  ) {
    return '/login';
  }

  return `/login?next=${encodeURIComponent(nextPath)}`;
}
