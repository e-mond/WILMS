export const SETTINGS_SECTION = {
  ORGANISATION: 'organisation',
  MY_ACCOUNT: 'my-account',
  USERS: 'users',
  ROLES: 'roles',
  EXPENSES: 'expenses',
  SECURITY: 'security',
  NOTIFICATIONS: 'notifications',
  LOAN_RULES: 'loan-rules',
  SMS: 'sms',
  DATA_EXPORTS: 'data-exports',
  INTEGRATIONS: 'integrations',
  AUDIT: 'audit',
} as const;

export type SettingsSection = (typeof SETTINGS_SECTION)[keyof typeof SETTINGS_SECTION];

export const SETTINGS_SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: SETTINGS_SECTION.ORGANISATION, label: 'Organisation' },
  { id: SETTINGS_SECTION.MY_ACCOUNT, label: 'My Account' },
  { id: SETTINGS_SECTION.USERS, label: 'User Management' },
  { id: SETTINGS_SECTION.ROLES, label: 'Roles & Permissions' },
  { id: SETTINGS_SECTION.SECURITY, label: 'Security & Access' },
  { id: SETTINGS_SECTION.NOTIFICATIONS, label: 'Notifications' },
  { id: SETTINGS_SECTION.LOAN_RULES, label: 'Loan Rules' },
  { id: SETTINGS_SECTION.SMS, label: 'SMS & Comms' },
  { id: SETTINGS_SECTION.INTEGRATIONS, label: 'Integrations' },
  { id: SETTINGS_SECTION.AUDIT, label: 'Audit & Logs' },
];
