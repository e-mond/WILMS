import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const messageDeliveries = pgTable('message_deliveries', {
  id: text('id').primaryKey(),
  event: text('event').notNull(),
  channel: text('channel').notNull(),
  recipient: text('recipient').notNull(),
  provider: text('provider'),
  providerMessageId: text('provider_message_id'),
  subject: text('subject'),
  bodyPreview: text('body_preview'),
  success: boolean('success').notNull().default(false),
  failureReason: text('failure_reason'),
  retryAttempts: integer('retry_attempts').notNull().default(0),
  borrowerId: text('borrower_id'),
  loanId: text('loan_id'),
  userId: text('user_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
