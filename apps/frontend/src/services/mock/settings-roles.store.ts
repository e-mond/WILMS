import { PERMISSION_DEFINITIONS, ROLE_DEFINITIONS } from '@/mocks/roles-permissions';
import type {
  CreateRoleInput,
  RoleDefinition,
  UpdateRoleInput,
  SettingsUserProfile,
} from '@/types/user-management';
import { buildUserProfileFromRecord } from '@/services/mock/settings-user-profiles.builder';
import { getSettingsUsersStore } from '@/services/mock/settings-users.store';

let roles: RoleDefinition[] = ROLE_DEFINITIONS.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));

function cloneRoles(): RoleDefinition[] {
  return roles.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
}

export function listPermissionDefinitions() {
  return PERMISSION_DEFINITIONS.map((permission) => ({ ...permission }));
}

export function listRoleDefinitions(): RoleDefinition[] {
  return cloneRoles();
}

export function getRoleDefinition(id: string): RoleDefinition | undefined {
  return cloneRoles().find((role) => role.id === id);
}

export function createRoleDefinition(input: CreateRoleInput): RoleDefinition {
  const created: RoleDefinition = {
    id: `role-${String(roles.length + 1).padStart(3, '0')}`,
    name: input.name.trim(),
    description: input.description.trim(),
    permissionIds: [...input.permissionIds],
    isSystem: false,
    userCount: 0,
  };

  roles = [...roles, created];
  return { ...created, permissionIds: [...created.permissionIds] };
}

export function updateRoleDefinition(id: string, input: UpdateRoleInput): RoleDefinition {
  const index = roles.findIndex((role) => role.id === id);

  if (index === -1) {
    throw new Error('Role not found');
  }

  const current = roles[index]!;

  if (current.isSystem && input.name && input.name !== current.name) {
    throw new Error('System roles cannot be renamed');
  }

  const updated: RoleDefinition = {
    ...current,
    ...input,
    permissionIds: input.permissionIds ? [...input.permissionIds] : [...current.permissionIds],
  };

  roles = [...roles.slice(0, index), updated, ...roles.slice(index + 1)];
  return { ...updated, permissionIds: [...updated.permissionIds] };
}

export function deleteRoleDefinition(id: string): void {
  const current = roles.find((role) => role.id === id);

  if (!current) {
    throw new Error('Role not found');
  }

  if (current.isSystem) {
    throw new Error('System roles cannot be deleted');
  }

  roles = roles.filter((role) => role.id !== id);
}

export function cloneRoleDefinition(id: string): RoleDefinition {
  const current = getRoleDefinition(id);

  if (!current) {
    throw new Error('Role not found');
  }

  const baseName = `${current.name} Copy`;
  const takenNames = new Set(roles.map((role) => role.name.trim().toLowerCase()));
  let cloneName = baseName;
  let suffix = 2;

  while (takenNames.has(cloneName.toLowerCase())) {
    cloneName = `${baseName} ${suffix}`;
    suffix += 1;
  }

  return createRoleDefinition({
    name: cloneName,
    description: current.description,
    permissionIds: current.permissionIds,
  });
}

export function getSettingsUserProfile(userId: string): SettingsUserProfile {
  const user = getSettingsUsersStore().find((entry) => entry.id === userId);

  if (!user) {
    throw new Error('Settings user not found');
  }

  return buildUserProfileFromRecord(user);
}

export function resetRoleDefinitionsStore(): void {
  roles = ROLE_DEFINITIONS.map((role) => ({ ...role, permissionIds: [...role.permissionIds] }));
}
