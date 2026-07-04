import { USER_ROLE, type UserRole } from '@/constants/roles';

export const ROLE_SETTINGS_SECTION = {
  PROFILE: 'profile',
  PIN: 'pin',
  APP_LOCK: 'app-lock',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications',
  DEVICE: 'device',
  SYNC: 'sync',
  CAMERA: 'camera',
  AUDIT_PREFERENCES: 'audit-preferences',
  USERS: 'users',
  ROLES: 'roles',
  INTEGRATIONS: 'integrations',
  RULES: 'rules',
} as const;

export type RoleSettingsSection = (typeof ROLE_SETTINGS_SECTION)[keyof typeof ROLE_SETTINGS_SECTION];

export interface RoleSettingsSectionDefinition {
  id: RoleSettingsSection;
  label: string;
}

export const ROLE_SETTINGS_SECTIONS: Record<UserRole, RoleSettingsSectionDefinition[]> = {
  [USER_ROLE.SUPER_ADMIN]: [
    { id: ROLE_SETTINGS_SECTION.SECURITY, label: 'Security' },
    { id: ROLE_SETTINGS_SECTION.USERS, label: 'Users' },
    { id: ROLE_SETTINGS_SECTION.ROLES, label: 'Roles' },
    { id: ROLE_SETTINGS_SECTION.INTEGRATIONS, label: 'Integrations' },
    { id: ROLE_SETTINGS_SECTION.NOTIFICATIONS, label: 'Notifications' },
    { id: ROLE_SETTINGS_SECTION.RULES, label: 'Rules' },
  ],
  [USER_ROLE.COLLECTOR]: [
    { id: ROLE_SETTINGS_SECTION.PROFILE, label: 'Profile' },
    { id: ROLE_SETTINGS_SECTION.PIN, label: 'PIN' },
    { id: ROLE_SETTINGS_SECTION.APP_LOCK, label: 'App Lock' },
    { id: ROLE_SETTINGS_SECTION.DEVICE, label: 'Device Settings' },
  ],
  [USER_ROLE.REGISTRATION_OFFICER]: [
    { id: ROLE_SETTINGS_SECTION.PROFILE, label: 'Profile' },
    { id: ROLE_SETTINGS_SECTION.APP_LOCK, label: 'App Lock' },
    { id: ROLE_SETTINGS_SECTION.CAMERA, label: 'Camera Settings' },
    { id: ROLE_SETTINGS_SECTION.NOTIFICATIONS, label: 'Notifications' },
    { id: ROLE_SETTINGS_SECTION.SYNC, label: 'Sync' },
  ],
  [USER_ROLE.APPROVER]: [
    { id: ROLE_SETTINGS_SECTION.PROFILE, label: 'Profile' },
    { id: ROLE_SETTINGS_SECTION.SECURITY, label: 'Security' },
    { id: ROLE_SETTINGS_SECTION.NOTIFICATIONS, label: 'Notifications' },
  ],
  [USER_ROLE.AUDITOR]: [
    { id: ROLE_SETTINGS_SECTION.PROFILE, label: 'Profile' },
    { id: ROLE_SETTINGS_SECTION.SECURITY, label: 'Security' },
    { id: ROLE_SETTINGS_SECTION.AUDIT_PREFERENCES, label: 'Audit Preferences' },
  ],
};
