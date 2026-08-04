import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** Tracks idempotent notification delivery attempts across all channels. */
export const notificationDeliveryRecords = pgTable('notification_delivery_records', {
  id: uuid('id').primaryKey(),
  dedupeKey: text('dedupe_key').notNull(),
  recipient: text('recipient').notNull(),
  channel: text('channel').notNull(),
  notificationType: text('notification_type').notNull(),
  status: text('status').notNull().default('PENDING'),
  correlationId: text('correlation_id'),
  borrowerId: uuid('borrower_id'),
  loanId: uuid('loan_id'),
  userId: uuid('user_id'),
  paymentId: uuid('payment_id'),
  metadata: jsonb('metadata'),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
});
