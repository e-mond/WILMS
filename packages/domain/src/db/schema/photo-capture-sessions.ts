import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const photoCaptureSessions = pgTable('photo_capture_sessions', {
  sessionToken: text('session_token').primaryKey(),
  registrationSessionId: text('registration_session_id').notNull(),
  officerId: uuid('officer_id')
    .notNull()
    .references(() => users.id),
  target: text('target').notNull(),
  status: text('status').notNull().default('PENDING'),
  uploadId: uuid('upload_id'),
  previewUrl: text('preview_url'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
