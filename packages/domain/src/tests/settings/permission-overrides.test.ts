import { beforeEach, describe, expect, it } from 'vitest';
import { PERMISSION } from '@wilms/shared-rbac';
import * as settingsService from '../../modules/settings/service.js';

describe('upsertUserPermissionOverrides', () => {
  beforeEach(async () => {
    const existing = await settingsService.listUserPermissionOverrides('user-collector');
    for (const override of existing) {
      await settingsService.deleteUserPermissionOverride(
        'user-collector',
        override.permissionId,
        'user-super-admin',
        'Test Admin',
      );
    }
  });

  it('rejects granting a permission already included in the role', async () => {
    await expect(
      settingsService.upsertUserPermissionOverrides(
        'user-collector',
        [{ permissionId: PERMISSION.RECORD_COLLECTIONS, granted: true }],
        'user-super-admin',
        'Test Admin',
      ),
    ).rejects.toThrow(/already has through their role/i);
  });

  it('rejects revoking a permission the role does not include', async () => {
    await expect(
      settingsService.upsertUserPermissionOverrides(
        'user-collector',
        [{ permissionId: PERMISSION.MANAGE_USERS, granted: false }],
        'user-super-admin',
        'Test Admin',
      ),
    ).rejects.toThrow(/does not receive from their role/i);
  });

  it('grants a permission outside the collector role', async () => {
    const result = await settingsService.upsertUserPermissionOverrides(
      'user-collector',
      [{ permissionId: PERMISSION.VIEW_REPORTS, granted: true }],
      'user-super-admin',
      'Test Admin',
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-collector',
          permissionId: PERMISSION.VIEW_REPORTS,
          granted: true,
        }),
      ]),
    );
  });

  it('revokes a permission included in the collector role', async () => {
    const result = await settingsService.upsertUserPermissionOverrides(
      'user-collector',
      [{ permissionId: PERMISSION.RECORD_EXPENSES, granted: false }],
      'user-super-admin',
      'Test Admin',
    );

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-collector',
          permissionId: PERMISSION.RECORD_EXPENSES,
          granted: false,
        }),
      ]),
    );
  });

  it('rejects grant overrides on Super Admin (role includes all permissions)', async () => {
    await expect(
      settingsService.upsertUserPermissionOverrides(
        'user-super-admin',
        [{ permissionId: PERMISSION.VIEW_REPORTS, granted: true }],
        'user-super-admin',
        'Test Admin',
      ),
    ).rejects.toThrow(/already has through their role/i);
  });

  it('exposes role permission ids on user profiles', async () => {
    const profile = await settingsService.getUserProfile('user-collector');
    expect(profile.assignedPermissionIds).toContain(PERMISSION.RECORD_COLLECTIONS);
    expect(profile.assignedPermissionIds).not.toContain(PERMISSION.MANAGE_USERS);
  });
});
