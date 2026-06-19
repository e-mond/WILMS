export interface SystemSettings {
  adminFeePesewas: number;
  reconciliationVarianceThresholdPercent: number;
  smsNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  paymentReminderDaysBefore: number;
  minGroupSize: number;
  maxGroupSize: number;
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

export interface UpdateSystemSettingsInput {
  minGroupSize?: number;
  maxGroupSize?: number;
}
