import {
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { loanExternalStatusEnum, loanLifecycleStatusEnum } from './enums';
import { borrowers } from './borrowers';
import { users } from './users';

export const loans = pgTable('loans', {
  id: uuid('id').primaryKey(),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  lifecycleStatus: loanLifecycleStatusEnum('lifecycle_status').notNull(),
  externalStatus: loanExternalStatusEnum('external_status').notNull(),
  principalAmount: numeric('principal_amount', { precision: 15, scale: 2 }).notNull(),
  approvedAmount: numeric('approved_amount', { precision: 15, scale: 2 }).notNull(),
  disbursedAmount: numeric('disbursed_amount', { precision: 15, scale: 2 })
    .notNull()
    .default('0'),
  installmentAmount: numeric('installment_amount', { precision: 15, scale: 2 }).notNull(),
  loanBalance: numeric('loan_balance', { precision: 15, scale: 2 }).notNull(),
  interestAmount: numeric('interest_amount', { precision: 15, scale: 6 }).notNull().default('0'),
  penaltyAmount: numeric('penalty_amount', { precision: 15, scale: 6 }).notNull().default('0'),
  currencyCode: text('currency_code').notNull().default('GHS'),
  durationWeeks: integer('duration_weeks').notNull(),
  paymentDay: text('payment_day').notNull(),
  startDate: text('start_date').notNull(),
  cycleBatch: text('cycle_batch').notNull(),
  loanPoolId: uuid('loan_pool_id'),
  rejectionReason: text('rejection_reason'),
  createdByUserId: uuid('created_by_user_id').references(() => users.id),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
  disbursedByUserId: uuid('disbursed_by_user_id').references(() => users.id),
  deletedByUserId: uuid('deleted_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  version: integer('version').notNull().default(1),
});
