'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { PermissionId } from '@/constants/permissions';
import {
  USER_ROLE_TO_RBAC_ROLE_ID,
  resolveUserPermissionIds,
} from '@/lib/rbac/permission-matrix';
import { useAuth } from '@/hooks/useAuth';
import type { UserPermissionOverride } from '@/types/rbac';

interface PermissionContextValue {
  permissionIds: Set<PermissionId>;
  overrides: UserPermissionOverride[];
  roleId: string | null;
  isLoading: boolean;
  hasPermission: (permissionId: PermissionId | string) => boolean;
  hasAnyPermission: (permissionIds: Array<PermissionId | string>) => boolean;
  hasAllPermissions: (permissionIds: Array<PermissionId | string>) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export function PermissionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const value = useMemo<PermissionContextValue>(() => {
    if (!user) {
      return {
        permissionIds: new Set(),
        overrides: [],
        roleId: null,
        isLoading: false,
        hasPermission: () => false,
        hasAnyPermission: () => false,
        hasAllPermissions: () => false,
      };
    }

    const roleId = USER_ROLE_TO_RBAC_ROLE_ID[user.role];
    const permissionIds = resolveUserPermissionIds(user.id, user.role);

    return {
      permissionIds,
      overrides: [],
      roleId,
      isLoading: false,
      hasPermission: (permissionId) => permissionIds.has(permissionId as PermissionId),
      hasAnyPermission: (required) =>
        required.some((permissionId) => permissionIds.has(permissionId as PermissionId)),
      hasAllPermissions: (required) =>
        required.every((permissionId) => permissionIds.has(permissionId as PermissionId)),
    };
  }, [user]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissionContext(): PermissionContextValue {
  const context = useContext(PermissionContext);

  if (!context) {
    throw new Error('usePermissionContext must be used within PermissionProvider');
  }

  return context;
}

/** Returns null outside PermissionProvider (e.g. isolated unit tests). */
export function useOptionalPermissionContext(): PermissionContextValue | null {
  return useContext(PermissionContext);
}
