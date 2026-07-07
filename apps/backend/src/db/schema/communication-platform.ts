import { integer, jsonb, pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';

export const emailTrackingEvents = pgTable('email_tracking_events', {
  id: text('id').primaryKey(),
  deliveryId: text('delivery_id').notNull(),
  eventType: text('event_type').notNull(),
  linkId: text('link_id'),
  destinationUrl: text('destination_url'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  deviceType: text('device_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messageAttachments = pgTable('message_attachments', {
  id: text('id').primaryKey(),
  messageId: text('message_id'),
  uploadId: text('upload_id').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  url: text('url').notNull(),
  createdByUserId: text('created_by_user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const userNotificationPreferences = pgTable('user_notification_preferences', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  smsEnabled: boolean('sms_enabled').notNull().default(true),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  marketingEnabled: boolean('marketing_enabled').notNull().default(true),
  announcementsEnabled: boolean('announcements_enabled').notNull().default(true),
  remindersEnabled: boolean('reminders_enabled').notNull().default(true),
  loanNotifications: boolean('loan_notifications').notNull().default(true),
  paymentNotifications: boolean('payment_notifications').notNull().default(true),
  approvalNotifications: boolean('approval_notifications').notNull().default(true),
  registrationNotifications: boolean('registration_notifications').notNull().default(true),
  digestFrequency: text('digest_frequency').notNull().default('INSTANT'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const communicationTemplateVersions = pgTable('communication_template_versions', {
  id: text('id').primaryKey(),
  templateId: text('template_id').notNull(),
  versionNumber: integer('version_number').notNull(),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyText: text('body_text').notNull(),
  variables: jsonb('variables'),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: text('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
