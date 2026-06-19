import type { UserPermissionOverride } from '@/types/rbac';

const OVERRIDE_STORE: UserPermissionOverride[] = [];

export function getUserPermissionOverrides(userId: string): UserPermissionOverride[] {
  return OVERRIDE_STORE.filter((entry) => entry.userId === userId);
}

export function setUserPermissionOverride(override: UserPermissionOverride): void {
  const index = OVERRIDE_STORE.findIndex(
    (entry) => entry.userId === override.userId && entry.permissionId === override.permissionId,
  );

  if (index >= 0) {
    OVERRIDE_STORE[index] = override;
    return;
  }

  OVERRIDE_STORE.push(override);
}
