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
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
