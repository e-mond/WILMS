import { integer, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { loans } from './loans';
import { users } from './users';

export const loanDisbursements = pgTable('loan_disbursements', {
  id: uuid('id').primaryKey(),
  displayId: text('display_id').notNull().unique(),
  loanId: uuid('loan_id')
    .notNull()
    .references(() => loans.id),
  disbursedAmount: numeric('disbursed_amount', { precision: 15, scale: 2 }).notNull(),
  currencyCode: text('currency_code').notNull().default('GHS'),
  disbursedByUserId: uuid('disbursed_by_user_id')
    .notNull()
    .references(() => users.id),
  disbursedAt: timestamp('disbursed_at', { withTimezone: true }).notNull(),
  idempotencyKeyId: uuid('idempotency_key_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
