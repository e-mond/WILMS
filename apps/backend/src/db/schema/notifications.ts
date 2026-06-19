import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import {
  notificationChannelEnum,
  notificationEventEnum,
  notificationSeverityEnum,
} from './enums';
import { users } from './users';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  title: text('title').notNull(),
  body: text('body').notNull(),
  event: notificationEventEnum('event').notNull(),
  channel: notificationChannelEnum('channel'),
  severity: notificationSeverityEnum('severity').notNull().default('INFO'),
  href: text('href'),
  borrowerId: uuid('borrower_id'),
  loanId: uuid('loan_id'),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
