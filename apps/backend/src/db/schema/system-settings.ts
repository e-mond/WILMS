import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey().default('default'),
  adminFeePesewas: integer('admin_fee_pesewas').notNull().default(5000),
  reconciliationVarianceThresholdPercent: integer('reconciliation_variance_threshold_percent')
    .notNull()
    .default(5),
  smsNotificationsEnabled: boolean('sms_notifications_enabled').notNull().default(true),
  emailNotificationsEnabled: boolean('email_notifications_enabled').notNull().default(true),
  paymentReminderDaysBefore: integer('payment_reminder_days_before').notNull().default(1),
  minGroupSize: integer('min_group_size').notNull().default(5),
  maxGroupSize: integer('max_group_size').notNull().default(15),
  organisationName: text('organisation_name').notNull().default('WILMS'),
  systemName: text('system_name')
    .notNull()
    .default("Women's Interest-Free Loan Management System"),
  primaryColour: text('primary_colour').notNull().default('#0F6E56'),
  accentColour: text('accent_colour').notNull().default('#BA7517'),
  logoAsset: text('logo_asset').notNull().default('wilms-logo.svg'),
  sessionTimeoutMinutes: integer('session_timeout_minutes').notNull().default(30),
  twoFactorRequired: boolean('two_factor_required').notNull().default(false),
  ipAllowlistEnabled: boolean('ip_allowlist_enabled').notNull().default(false),
  failedLoginLockoutAttempts: integer('failed_login_lockout_attempts').notNull().default(5),
  passwordPolicy: text('password_policy').notNull().default('strong'),
  maxLoanAmountPesewas: integer('max_loan_amount_pesewas').notNull().default(500_000),
  defaultLoanDurationWeeks: integer('default_loan_duration_weeks').notNull().default(12),
  allowLoanRollovers: boolean('allow_loan_rollovers').notNull().default(true),
  latePaymentGraceDays: integer('late_payment_grace_days').notNull().default(3),
  smsProvider: text('sms_provider').notNull().default('smsnotifygh'),
  smsSenderId: text('sms_sender_id').notNull().default('WILMS-GH'),
  missedPaymentSmsEnabled: boolean('missed_payment_sms_enabled').notNull().default(true),
  approvalSmsEnabled: boolean('approval_sms_enabled').notNull().default(true),
  supervisorEscalationsEnabled: boolean('supervisor_escalations_enabled').notNull().default(true),
  immutableAuditTrail: boolean('immutable_audit_trail').notNull().default(true),
  auditExportEnabled: boolean('audit_export_enabled').notNull().default(true),
  monitoringAlertsEnabled: boolean('monitoring_alerts_enabled').notNull().default(true),
  gpsVerificationEnabled: boolean('gps_verification_enabled').notNull().default(true),
  emailProviderLabel: text('email_provider_label').notNull().default('Gmail SMTP'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
