import { USER_ROLE, type UserRole } from '@/constants/roles';
import {
  canAccessPathWithPermissions,
  getPortalHomePath,
  resolveUserPermissionIds,
} from '@/lib/rbac/permission-matrix';

export const PUBLIC_PATHS = ['/login', '/forgot-password', '/reset-password', '/session-expired', '/capture'] as const;

/** @deprecated Use getPortalHomePath from permission-matrix. */
export const ROLE_HOME_PATH: Record<UserRole, string> = {
  [USER_ROLE.SUPER_ADMIN]: getPortalHomePath(USER_ROLE.SUPER_ADMIN),
  [USER_ROLE.COLLECTOR]: getPortalHomePath(USER_ROLE.COLLECTOR),
  [USER_ROLE.REGISTRATION_OFFICER]: getPortalHomePath(USER_ROLE.REGISTRATION_OFFICER),
  [USER_ROLE.APPROVER]: getPortalHomePath(USER_ROLE.APPROVER),
  [USER_ROLE.AUDITOR]: getPortalHomePath(USER_ROLE.AUDITOR),
};

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function getRoleHomePath(role: UserRole | null | undefined): string {
  if (!role) {
    return '/login';
  }

  return getPortalHomePath(role);
}

export function canRoleAccessPath(
  role: UserRole,
  pathname: string,
  userId = `user-${role.toLowerCase().replace(/_/g, '-')}`,
): boolean {
  if (pathname === '/') {
    return true;
  }

  const permissionIds = resolveUserPermissionIds(userId, role);
  return canAccessPathWithPermissions(permissionIds, pathname);
}
