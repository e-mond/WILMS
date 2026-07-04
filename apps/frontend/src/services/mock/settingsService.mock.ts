import { MOCK_SETTINGS_ACTIVITY } from '@/mocks/settings-activity';
import { MOCK_SETTINGS_USERS } from '@/mocks/settings-users';
import {
  getSystemSettingsStore,
  updateSystemSettingsStore,
} from '@/services/mock/settings.store';
import {
  MOCK_REGISTRATION_LEGAL_CONFIG,
} from '@/mocks/registration-legal';
import type { ISettingsService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';
import {
  activateSettingsUser,
  createSettingsUser,
  deleteSettingsUser,
  disableSettingsUser,
  getSettingsUsersStore,
  updateSettingsUser,
} from '@/services/mock/settings-users.store';
import {
  cloneRoleDefinition,
  createRoleDefinition,
  deleteRoleDefinition,
  getSettingsUserProfile,
  listPermissionDefinitions,
  listRoleDefinitions,
  updateRoleDefinition,
} from '@/services/mock/settings-roles.store';

const settingsServiceMock: ISettingsService = {
  async getSettings() {
    await simulateDelay();
    return getSystemSettingsStore();
  },

  async updateSettings(input) {
    await simulateDelay();

    const current = getSystemSettingsStore();
    const minGroupSize = input.minGroupSize ?? current.minGroupSize;
    const maxGroupSize = input.maxGroupSize ?? current.maxGroupSize;

    if (minGroupSize < 1) {
      throw new Error('Minimum group size must be at least 1.');
    }

    if (maxGroupSize < minGroupSize) {
      throw new Error('Maximum group size cannot be less than minimum group size.');
    }

    return updateSystemSettingsStore({ ...input, minGroupSize, maxGroupSize });
  },

  async getSettingsMe() {
    await simulateDelay();
    const user = MOCK_SETTINGS_USERS[0]!;
    return {
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      roleLabel: user.roleLabel,
      phone: '0244123456',
    };
  },

  async updateSettingsMe(input) {
    await simulateDelay();
    const profile = await settingsServiceMock.getSettingsMe();
    return {
      ...profile,
      displayName: input.displayName?.trim() ?? profile.displayName,
      email: input.email?.trim().toLowerCase() ?? profile.email,
    };
  },

  async sendTestSms() {
    await simulateDelay();
    return { ok: true as const };
  },

  async getSmsBalance() {
    await simulateDelay();
    return { balance: 'Demo balance' };
  },

  async sendTestEmail() {
    await simulateDelay();
    return { ok: true as const };
  },

  async getIntegrationsStatus() {
    await simulateDelay();
    return {
      sms: {
        provider: 'smsnotifygh',
        configured: true,
        setupHint: 'Demo mode — SMS provider simulated as configured.',
      },
      mail: {
        provider: 'gmail',
        configured: true,
        setupHint: 'Demo mode — mail provider simulated as configured.',
      },
    };
  },

  async listUsers() {
    await simulateDelay();
    return getSettingsUsersStore();
  },

  async getUserProfile(userId) {
    await simulateDelay();
    return getSettingsUserProfile(userId);
  },

  async getSettingsActivity() {
    await simulateDelay();
    return [...MOCK_SETTINGS_ACTIVITY];
  },

  async listPermissions() {
    await simulateDelay();
    return listPermissionDefinitions();
  },

  async listRoles() {
    await simulateDelay();
    return listRoleDefinitions();
  },

  async createRole(input) {
    await simulateDelay();
    return createRoleDefinition(input);
  },

  async updateRole(id, input) {
    await simulateDelay();
    return updateRoleDefinition(id, input);
  },

  async deleteRole(id) {
    await simulateDelay();
    deleteRoleDefinition(id);
  },

  async cloneRole(id) {
    await simulateDelay();
    return cloneRoleDefinition(id);
  },

  async createUser(input) {
    await simulateDelay();
    return createSettingsUser(input);
  },

  async updateUser(id, input) {
    await simulateDelay();
    return updateSettingsUser(id, input);
  },

  async disableUser(id) {
    await simulateDelay();
    return disableSettingsUser(id);
  },

  async activateUser(id) {
    await simulateDelay();
    return activateSettingsUser(id);
  },

  async deleteUser(id) {
    await simulateDelay();
    deleteSettingsUser(id);
  },

  async getRegistrationLegalConfig() {
    await simulateDelay();
    return { ...MOCK_REGISTRATION_LEGAL_CONFIG };
  },
};

export default settingsServiceMock;
