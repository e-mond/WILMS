import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { paymentStatusEnum } from './enums';
import { borrowers } from './borrowers';
import { loans } from './loans';
import { users } from './users';

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey(),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  collectorUserId: uuid('collector_user_id')
    .notNull()
    .references(() => users.id),
  loanId: uuid('loan_id').references(() => loans.id),
  scheduleWeekNumber: integer('schedule_week_number'),
  idempotencyKeyId: uuid('idempotency_key_id'),
  amountPesewas: integer('amount_pesewas').notNull(),
  paymentDate: text('payment_date').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  status: paymentStatusEnum('status').notNull().default('CONFIRMED'),
  gps: jsonb('gps'),
  editReason: text('edit_reason'),
  editedAt: timestamp('edited_at', { withTimezone: true }),
  editedByUserId: uuid('edited_by_user_id').references(() => users.id),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
