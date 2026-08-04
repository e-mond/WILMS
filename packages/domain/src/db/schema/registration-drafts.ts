import { integer, jsonb, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const registrationDrafts = pgTable('registration_drafts', {
  id: uuid('id').primaryKey(),
  officerUserId: uuid('officer_user_id')
    .notNull()
    .references(() => users.id),
  draftPayload: jsonb('draft_payload').notNull().default({}),
  lastCompletedStep: integer('last_completed_step').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
