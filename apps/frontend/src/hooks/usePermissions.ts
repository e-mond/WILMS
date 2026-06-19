'use client';

import { usePermissionContext } from '@/components/providers/PermissionProvider';
import type { PermissionId } from '@/constants/permissions';

export function usePermissions() {
  const context = usePermissionContext();

  return {
    permissionIds: context.permissionIds,
    overrides: context.overrides,
    roleId: context.roleId,
    isLoading: context.isLoading,
    hasPermission: context.hasPermission,
    hasAnyPermission: context.hasAnyPermission,
    hasAllPermissions: context.hasAllPermissions,
  };
}

export function usePermission(permissionId: PermissionId | string): boolean {
  const { hasPermission, isLoading } = usePermissions();
  return !isLoading && hasPermission(permissionId);
}
