import { getRoleHomePath, isPublicPath } from '@/lib/auth/routes';
import type { UserRole } from '@/constants/roles';

export function resolveSafeRedirect(nextPath: string | null | undefined, role: UserRole): string {
  if (!nextPath) {
    return getRoleHomePath(role);
  }

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return getRoleHomePath(role);
  }

  if (isPublicPath(nextPath)) {
    return getRoleHomePath(role);
  }

  return nextPath;
}
