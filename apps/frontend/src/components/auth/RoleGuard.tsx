'use client';

import type { ReactNode } from 'react';
import type { UserRole } from '@/constants/roles';
import { USER_ROLE } from '@/constants/roles';
import { PERMISSION, type PermissionId } from '@/constants/permissions';
import { PermissionRouteGuard } from '@/components/auth/PermissionRouteGuard';

const ROLE_PORTAL_PERMISSIONS: Record<UserRole, PermissionId[]> = {
  [USER_ROLE.SUPER_ADMIN]: [PERMISSION.ACCESS_ADMIN_PORTAL],
  [USER_ROLE.COLLECTOR]: [PERMISSION.ACCESS_COLLECTOR_PORTAL],
  [USER_ROLE.REGISTRATION_OFFICER]: [PERMISSION.ACCESS_REGISTRATION_PORTAL],
  [USER_ROLE.APPROVER]: [PERMISSION.ACCESS_APPROVER_PORTAL],
  [USER_ROLE.AUDITOR]: [PERMISSION.ACCESS_AUDITOR_PORTAL],
};

interface RoleGuardProps {
  requiredRole: UserRole;
  children: ReactNode;
}

/**
 * Layout guard — maps legacy role shells to portal permissions.
 * Prefer PermissionRouteGuard or PermissionGate in new code.
 */
export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  return (
    <PermissionRouteGuard requiredPermissions={ROLE_PORTAL_PERMISSIONS[requiredRole]}>
      {children}
    </PermissionRouteGuard>
  );
}
