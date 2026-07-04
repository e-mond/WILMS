'use client';

import {
  useOptionalPermissionContext,
  usePermissionContext,
} from '@/components/providers/PermissionProvider';
import type { PermissionId } from '@/constants/permissions';

const NO_PERMISSIONS = {
  permissionIds: new Set<PermissionId>(),
  overrides: [],
  roleId: null,
  isLoading: false,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
} as const;

export function usePermissions() {
  const context = useOptionalPermissionContext();

  if (!context) {
    return NO_PERMISSIONS;
  }

  return context;
}

export function usePermission(permissionId: PermissionId | string): boolean {
  const context = useOptionalPermissionContext();

  if (!context || context.isLoading) {
    return false;
  }

  return context.hasPermission(permissionId);
}

/** Strict hook for components that require PermissionProvider. */
export function useRequiredPermissions() {
  return usePermissionContext();
}
