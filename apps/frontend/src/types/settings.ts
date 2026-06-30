export interface SystemSettings {
  adminFeePesewas: number;
  reconciliationVarianceThresholdPercent: number;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  paymentReminderDaysBefore: number;
  minGroupSize: number;
  maxGroupSize: number;
  organisationName: string;
  systemName: string;
  primaryColour: string;
  accentColour: string;
  logoAsset: string;
  sessionTimeoutMinutes: number;
  twoFactorRequired: boolean;
  ipAllowlistEnabled: boolean;
  failedLoginLockoutAttempts: number;
  passwordPolicy: string;
  maxLoanAmountPesewas: number;
  defaultLoanDurationWeeks: number;
  allowLoanRollovers: boolean;
  latePaymentGraceDays: number;
  smsProvider: string;
  smsSenderId: string;
  missedPaymentSmsEnabled: boolean;
  approvalSmsEnabled: boolean;
  supervisorEscalationsEnabled: boolean;
  immutableAuditTrail: boolean;
  auditExportEnabled: boolean;
  monitoringAlertsEnabled: boolean;
  gpsVerificationEnabled: boolean;
  emailProviderLabel: string;
  updatedAt: string;
}

export interface SettingsUserRecord {
  id: string;
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  roleTone: 'gold' | 'primary' | 'info' | 'muted';
  lastLoginLabel: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  isCurrentUser?: boolean;
  photoUrl?: string | null;
}

export interface SettingsActivityEntry {
  id: string;
  title: string;
  occurredAt: string;
  actorLabel: string;
}

export interface SettingsMeProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  phone?: string;
}

export interface UpdateSettingsMeInput {
  displayName?: string;
  email?: string;
}

export interface CreateSettingsUserInput {
  displayName: string;
  email: string;
  role: string;
}

export interface UpdateSettingsUserInput {
  displayName?: string;
  email?: string;
  role?: string;
  status?: SettingsUserRecord['status'];
}

export type UpdateSystemSettingsInput = Partial<
  Omit<SystemSettings, 'updatedAt'>
>;
