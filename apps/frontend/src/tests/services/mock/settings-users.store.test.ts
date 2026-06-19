import { describe, expect, it, beforeEach } from 'vitest';
import {
  activateSettingsUser,
  createSettingsUser,
  deleteSettingsUser,
  disableSettingsUser,
  getSettingsUsersStore,
  resetSettingsUsersStore,
  updateSettingsUser,
} from '@/services/mock/settings-users.store';
import { USER_ROLE } from '@/constants/roles';

describe('settings-users.store', () => {
  beforeEach(() => {
    resetSettingsUsersStore();
  });

  it('creates, updates, suspends, activates, and deletes users', () => {
    const created = createSettingsUser({
      displayName: 'Test User',
      email: 'test.user@wilms.demo',
      role: USER_ROLE.APPROVER,
    });

    expect(created.status).toBe('INVITED');
    expect(getSettingsUsersStore()).toHaveLength(6);

    const updated = updateSettingsUser(created.id, { displayName: 'Updated User' });
    expect(updated.displayName).toBe('Updated User');

    const suspended = disableSettingsUser(created.id);
    expect(suspended.status).toBe('SUSPENDED');

    const activated = activateSettingsUser(created.id);
    expect(activated.status).toBe('ACTIVE');

    deleteSettingsUser(created.id);
    expect(getSettingsUsersStore()).toHaveLength(5);
  });

  it('prevents deleting the current user', () => {
    expect(() => deleteSettingsUser('user-super-admin')).toThrow(/current user/i);
  });
});
