/**
 * RBAC domain models — backend-ready shapes for API sync.
 */

export interface Permission {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  userCount: number;
}

export interface RolePermission {
  roleId: string;
  permissionId: string;
}

export interface UserPermissionOverride {
  userId: string;
  permissionId: string;
  granted: boolean;
  reason?: string;
  grantedBy?: string;
  grantedAt: string;
}

export interface ResolvedUserPermissions {
  userId: string;
  roleId: string;
  permissionIds: string[];
  overrides: UserPermissionOverride[];
}
