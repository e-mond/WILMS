import { describe, expect, it } from 'vitest';
import { USER_ROLE } from '@/constants/roles';
import {
  canRoleAccessPath,
  getRoleHomePath,
  isPublicPath,
} from '@/lib/auth/routes';

describe('auth routes', () => {
  it('identifies public paths', () => {
    expect(isPublicPath('/login')).toBe(true);
    expect(isPublicPath('/session-expired')).toBe(true);
    expect(isPublicPath('/dashboard')).toBe(false);
  });

  it('maps roles to home paths', () => {
    expect(getRoleHomePath(USER_ROLE.SUPER_ADMIN)).toBe('/dashboard');
    expect(getRoleHomePath(USER_ROLE.COLLECTOR)).toBe('/collector/dashboard');
    expect(getRoleHomePath(USER_ROLE.AUDITOR)).toBe('/auditor/reports');
    expect(getRoleHomePath(null)).toBe('/login');
  });

  it('enforces permission-based route boundaries', () => {
    expect(canRoleAccessPath(USER_ROLE.COLLECTOR, '/collector/dashboard', 'user-collector')).toBe(true);
    expect(canRoleAccessPath(USER_ROLE.COLLECTOR, '/dashboard', 'user-collector')).toBe(false);
    expect(canRoleAccessPath(USER_ROLE.SUPER_ADMIN, '/dashboard', 'user-super-admin')).toBe(true);
    expect(canRoleAccessPath(USER_ROLE.AUDITOR, '/auditor/reports', 'user-auditor')).toBe(true);
    expect(canRoleAccessPath(USER_ROLE.AUDITOR, '/settings', 'user-auditor')).toBe(false);
    expect(canRoleAccessPath(USER_ROLE.APPROVER, '/officer/register', 'user-approver')).toBe(false);
  });
});
