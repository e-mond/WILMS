/**
 * P14.3B Phase 3C.1 — Financial reversal persistence schema.
 *
 * financial_reversals: workflow record for compensating transaction reversals.
 * reversal_history: append-only before/after trail (transactional source of truth).
 */
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { borrowers } from './borrowers';
import { loans } from './loans';
import { users } from './users';
import {
  reversalHistoryEventEnum,
  reversalSourceTypeEnum,
  reversalStatusEnum,
} from './enums';

export const financialReversals = pgTable('financial_reversals', {
  id: uuid('id').primaryKey(),
  sourceType: reversalSourceTypeEnum('source_type').notNull(),
  sourceId: uuid('source_id').notNull(),
  loanId: uuid('loan_id').references(() => loans.id),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  amountPesewas: integer('amount_pesewas').notNull(),
  reason: text('reason').notNull(),
  status: reversalStatusEnum('status').notNull().default('PENDING'),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
  executedByUserId: uuid('executed_by_user_id').references(() => users.id),
  executedAt: timestamp('executed_at', { withTimezone: true }),
  beforeBalancePesewas: integer('before_balance_pesewas'),
  afterBalancePesewas: integer('after_balance_pesewas'),
  deltaPesewas: integer('delta_pesewas'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const reversalHistory = pgTable('reversal_history', {
  id: uuid('id').primaryKey(),
  reversalId: uuid('reversal_id')
    .notNull()
    .references(() => financialReversals.id),
  eventType: reversalHistoryEventEnum('event_type').notNull(),
  actorUserId: uuid('actor_user_id')
    .notNull()
    .references(() => users.id),
  actorDisplayName: text('actor_display_name').notNull(),
  reason: text('reason'),
  beforeValuePesewas: integer('before_value_pesewas'),
  afterValuePesewas: integer('after_value_pesewas'),
  deltaPesewas: integer('delta_pesewas'),
  metadata: jsonb('metadata'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
});
