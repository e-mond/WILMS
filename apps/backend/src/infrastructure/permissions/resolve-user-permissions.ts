import { eq, inArray } from 'drizzle-orm';
import {
  getPermissionsForRole,
  type PermissionId,
  type UserRole,
} from '@wilms/shared-rbac';
import { getDb, isDatabaseEnabled } from '../../db/client.js';
import { rolePermissions, userPermissionOverrides, userRoles } from '../../db/schema/rbac.js';

export async function resolveUserPermissions(
  userId: string,
  role: UserRole,
): Promise<Set<PermissionId>> {
  if (!isDatabaseEnabled()) {
    return getPermissionsForRole(role);
  }

  const db = getDb();
  const roleRows = await db
    .select({ roleId: userRoles.roleId })
    .from(userRoles)
    .where(eq(userRoles.userId, userId));

  let base = new Set<PermissionId>();

  if (roleRows.length > 0) {
    const roleIds = roleRows.map((row) => row.roleId);
    const permissionRows = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(inArray(rolePermissions.roleId, roleIds));

    for (const row of permissionRows) {
      base.add(row.permissionId as PermissionId);
    }
  }

  if (base.size === 0) {
    base = getPermissionsForRole(role);
  }

  const overrides = await db
    .select({
      permissionId: userPermissionOverrides.permissionId,
      granted: userPermissionOverrides.granted,
    })
    .from(userPermissionOverrides)
    .where(eq(userPermissionOverrides.userId, userId));

  for (const override of overrides) {
    const permissionId = override.permissionId as PermissionId;
    if (override.granted) {
      base.add(permissionId);
    } else {
      base.delete(permissionId);
    }
  }

  return base;
}

export function permissionSetHasAny(
  permissionIds: Set<PermissionId>,
  required: PermissionId[],
): boolean {
  return required.some((permission) => permissionIds.has(permission));
}
