import type { CreateSettingsUserInput, SystemSettings, UpdateSettingsUserInput, UpdateSystemSettingsInput } from '@/types/settings';
import type { CreateRoleInput, UpdateRoleInput } from '@/types/user-management';
import type { ISettingsService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const settingsService: ISettingsService = {
  getSettings(): Promise<SystemSettings> {
    return apiClient.get<SystemSettings>('/settings');
  },

  updateSettings(input: UpdateSystemSettingsInput): Promise<SystemSettings> {
    return apiClient.patch<SystemSettings>('/settings', input);
  },

  listUsers() {
    return apiClient.get('/settings/users');
  },

  getUserProfile(userId) {
    return apiClient.get(`/settings/users/${userId}/profile`);
  },

  getSettingsActivity() {
    return apiClient.get('/settings/activity');
  },

  listPermissions() {
    return apiClient.get('/settings/permissions');
  },

  listRoles() {
    return apiClient.get('/settings/roles');
  },

  createRole(input: CreateRoleInput) {
    return apiClient.post('/settings/roles', input);
  },

  updateRole(id, input: UpdateRoleInput) {
    return apiClient.patch(`/settings/roles/${id}`, input);
  },

  deleteRole(id) {
    return apiClient.post(`/settings/roles/${id}/delete`, {});
  },

  cloneRole(id) {
    return apiClient.post(`/settings/roles/${id}/clone`, {});
  },

  createUser(input: CreateSettingsUserInput) {
    return apiClient.post('/settings/users', input);
  },

  updateUser(id: string, input: UpdateSettingsUserInput) {
    return apiClient.patch(`/settings/users/${id}`, input);
  },

  disableUser(id: string) {
    return apiClient.post(`/settings/users/${id}/disable`, {});
  },

  activateUser(id: string) {
    return apiClient.post(`/settings/users/${id}/activate`, {});
  },

  deleteUser(id: string) {
    return apiClient.post(`/settings/users/${id}/delete`, {});
  },

  getRegistrationLegalConfig() {
    return apiClient.get('/settings/registration-legal');
  },
};

export default settingsService;
