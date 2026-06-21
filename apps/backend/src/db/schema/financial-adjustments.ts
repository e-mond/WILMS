/**
 * P14.3B Phase 2 — Financial adjustment schema.
 *
 * Persistence model:
 * - financial_adjustments: approval-gated correction requests (frontend AdjustmentRequest)
 * - adjustment_reasons: catalog of standardized correction categories
 * - adjustment_history: immutable before/after/delta trail per lifecycle event
 */
import { boolean, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { borrowers } from './borrowers';
import { loans } from './loans';
import { users } from './users';
import {
  adjustmentHistoryEventEnum,
  adjustmentReasonCategoryEnum,
  adjustmentStatusEnum,
  adjustmentTypeEnum,
} from './enums';

/** Catalog of standardized adjustment reason codes (fee, interest, admin, balance, manual). */
export const adjustmentReasons = pgTable('adjustment_reasons', {
  id: uuid('id').primaryKey(),
  code: text('code').notNull().unique(),
  label: text('label').notNull(),
  category: adjustmentReasonCategoryEnum('category').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Financial adjustment request — mirrors frontend AdjustmentRequest.
 * Balance fields (before/after/delta) are populated atomically on approval.
 */
export const financialAdjustments = pgTable('financial_adjustments', {
  id: uuid('id').primaryKey(),
  type: adjustmentTypeEnum('type').notNull(),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  borrowerName: text('borrower_name').notNull(),
  loanId: uuid('loan_id').references(() => loans.id),
  amountPesewas: integer('amount_pesewas').notNull(),
  reason: text('reason').notNull(),
  reasonCode: text('reason_code').references(() => adjustmentReasons.code),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  requestedByDisplayName: text('requested_by_display_name').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull(),
  status: adjustmentStatusEnum('status').notNull().default('PENDING'),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  beforeBalancePesewas: integer('before_balance_pesewas'),
  afterBalancePesewas: integer('after_balance_pesewas'),
  deltaPesewas: integer('delta_pesewas'),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Append-only adjustment history — records actor, reason, and balance delta per event.
 * No updates or deletes; supports audit and reconciliation review.
 */
export const adjustmentHistory = pgTable('adjustment_history', {
  id: uuid('id').primaryKey(),
  adjustmentId: uuid('adjustment_id')
    .notNull()
    .references(() => financialAdjustments.id),
  eventType: adjustmentHistoryEventEnum('event_type').notNull(),
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
