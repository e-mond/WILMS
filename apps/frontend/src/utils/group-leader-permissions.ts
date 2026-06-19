import { USER_ROLE, type UserRole } from '@/constants/roles';

export interface GroupLeaderPermissionResult {
  canAssignLeader: boolean;
  canChangeLeader: boolean;
}

export function resolveGroupLeaderPermissions(role: UserRole | undefined): GroupLeaderPermissionResult {
  switch (role) {
    case USER_ROLE.SUPER_ADMIN:
      return { canAssignLeader: true, canChangeLeader: true };
    case USER_ROLE.COLLECTOR:
      return { canAssignLeader: true, canChangeLeader: true };
    case USER_ROLE.APPROVER:
      return { canAssignLeader: true, canChangeLeader: false };
    default:
      return { canAssignLeader: false, canChangeLeader: false };
  }
}

export function canReplaceGroupLeader(role: UserRole | undefined): boolean {
  const permissions = resolveGroupLeaderPermissions(role);
  return permissions.canAssignLeader || permissions.canChangeLeader;
}

export function canManageGroupLeader(
  role: UserRole | undefined,
  hasExistingLeader: boolean,
): boolean {
  const permissions = resolveGroupLeaderPermissions(role);

  if (permissions.canChangeLeader) {
    return true;
  }

  return permissions.canAssignLeader && !hasExistingLeader;
}
