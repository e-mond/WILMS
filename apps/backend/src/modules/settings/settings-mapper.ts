import type { SystemSettingsRow } from '../../repositories/system-settings.repository.js';

export interface SystemSettingsDto {
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
  integrationStatus?: import('../../infrastructure/integrations/status.js').IntegrationStatusReport;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettingsDto = {
  adminFeePesewas: 5000,
  reconciliationVarianceThresholdPercent: 5,
  smsNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  paymentReminderDaysBefore: 1,
  minGroupSize: 5,
  maxGroupSize: 10,
  organisationName: 'WILMS',
  systemName: "Women's Interest-Free Loan Management System",
  primaryColour: '#0F6E56',
  accentColour: '#BA7517',
  logoAsset: 'wilms-logo.svg',
  sessionTimeoutMinutes: 30,
  twoFactorRequired: false,
  ipAllowlistEnabled: false,
  failedLoginLockoutAttempts: 5,
  passwordPolicy: 'strong',
  maxLoanAmountPesewas: 500_000,
  defaultLoanDurationWeeks: 12,
  allowLoanRollovers: true,
  latePaymentGraceDays: 3,
  smsProvider: 'smsnotifygh',
  smsSenderId: 'WILMS-GH',
  missedPaymentSmsEnabled: true,
  approvalSmsEnabled: true,
  supervisorEscalationsEnabled: true,
  immutableAuditTrail: true,
  auditExportEnabled: true,
  monitoringAlertsEnabled: true,
  gpsVerificationEnabled: true,
  emailProviderLabel: 'Gmail SMTP',
  updatedAt: '2026-06-01T08:00:00.000Z',
};

export function mapSystemSettingsRow(row: SystemSettingsRow): SystemSettingsDto {
  return {
    adminFeePesewas: row.adminFeePesewas,
    reconciliationVarianceThresholdPercent: row.reconciliationVarianceThresholdPercent,
    smsNotificationsEnabled: row.smsNotificationsEnabled,
    emailNotificationsEnabled: row.emailNotificationsEnabled,
    paymentReminderDaysBefore: row.paymentReminderDaysBefore,
    minGroupSize: row.minGroupSize,
    maxGroupSize: row.maxGroupSize,
    organisationName: row.organisationName,
    systemName: row.systemName,
    primaryColour: row.primaryColour,
    accentColour: row.accentColour,
    logoAsset: row.logoAsset,
    sessionTimeoutMinutes: row.sessionTimeoutMinutes,
    twoFactorRequired: row.twoFactorRequired,
    ipAllowlistEnabled: row.ipAllowlistEnabled,
    failedLoginLockoutAttempts: row.failedLoginLockoutAttempts,
    passwordPolicy: row.passwordPolicy,
    maxLoanAmountPesewas: row.maxLoanAmountPesewas,
    defaultLoanDurationWeeks: row.defaultLoanDurationWeeks,
    allowLoanRollovers: row.allowLoanRollovers,
    latePaymentGraceDays: row.latePaymentGraceDays,
    smsProvider: row.smsProvider,
    smsSenderId: row.smsSenderId,
    missedPaymentSmsEnabled: row.missedPaymentSmsEnabled,
    approvalSmsEnabled: row.approvalSmsEnabled,
    supervisorEscalationsEnabled: row.supervisorEscalationsEnabled,
    immutableAuditTrail: row.immutableAuditTrail,
    auditExportEnabled: row.auditExportEnabled,
    monitoringAlertsEnabled: row.monitoringAlertsEnabled,
    gpsVerificationEnabled: row.gpsVerificationEnabled,
    emailProviderLabel: row.emailProviderLabel,
    updatedAt: row.updatedAt.toISOString(),
  };
}
