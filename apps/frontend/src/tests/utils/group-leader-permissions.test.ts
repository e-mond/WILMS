import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import {
  canManageGroupLeader,
  resolveGroupLeaderPermissions,
} from '@/utils/group-leader-permissions';

describe('group leader permissions', () => {
  it('grants full override to super admin', () => {
    expect(resolveGroupLeaderPermissions(USER_ROLE.SUPER_ADMIN)).toEqual({
      canAssignLeader: true,
      canChangeLeader: true,
    });
    expect(canManageGroupLeader(USER_ROLE.SUPER_ADMIN, true)).toBe(true);
  });

  it('allows collector to assign and change leaders', () => {
    expect(resolveGroupLeaderPermissions(USER_ROLE.COLLECTOR)).toEqual({
      canAssignLeader: true,
      canChangeLeader: true,
    });
    expect(canManageGroupLeader(USER_ROLE.COLLECTOR, true)).toBe(true);
  });

  it('allows approver to assign only when no leader exists', () => {
    expect(resolveGroupLeaderPermissions(USER_ROLE.APPROVER)).toEqual({
      canAssignLeader: true,
      canChangeLeader: false,
    });
    expect(canManageGroupLeader(USER_ROLE.APPROVER, false)).toBe(true);
    expect(canManageGroupLeader(USER_ROLE.APPROVER, true)).toBe(false);
  });
});
