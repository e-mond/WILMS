/**
 * P14.3B Phase 4C.1 — Collector cash reconciliation schema.
 *
 * financial_reconciliations: immutable end-of-day submission per collector + date.
 * reconciliation_history: append-only audit trail with before/after JSON snapshots.
 *
 * Retention: indefinite — financial control records; no soft-delete on submissions.
 */
import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';
import {
  reconciliationHistoryEventEnum,
  reconciliationStatusEnum,
  reconciliationVarianceClassEnum,
} from './enums';

/**
 * End-of-day collector cash reconciliation submission.
 * Snapshots expected due, system recorded, and physical cash at submit time.
 * One SUBMITTED row per (collector_user_id, reconciliation_date) enforced by partial unique index.
 */
export const financialReconciliations = pgTable(
  'financial_reconciliations',
  {
    id: uuid('id').primaryKey(),
    collectorUserId: uuid('collector_user_id')
      .notNull()
      .references(() => users.id),
    reconciliationDate: text('reconciliation_date').notNull(),
    expectedDuePesewas: integer('expected_due_pesewas').notNull(),
    systemRecordedPesewas: integer('system_recorded_pesewas').notNull(),
    physicalCashPesewas: integer('physical_cash_pesewas').notNull(),
    primaryVariancePesewas: integer('primary_variance_pesewas').notNull(),
    collectionDeltaPesewas: integer('collection_delta_pesewas').notNull(),
    varianceClass: reconciliationVarianceClassEnum('variance_class').notNull(),
    varianceFlagged: boolean('variance_flagged').notNull(),
    thresholdPercent: integer('threshold_percent').notNull(),
    comment: text('comment'),
    status: reconciliationStatusEnum('status').notNull().default('SUBMITTED'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull(),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('financial_reconciliations_collector_date_uidx').on(
      table.collectorUserId,
      table.reconciliationDate,
    ),
  ],
);

/**
 * Append-only reconciliation event log — mirrors adjustment_history / reversal_history.
 * No updates or deletes; actor and full after_snapshot preserved for audit review.
 */
export const reconciliationHistory = pgTable('reconciliation_history', {
  id: uuid('id').primaryKey(),
  reconciliationId: uuid('reconciliation_id')
    .notNull()
    .references(() => financialReconciliations.id),
  eventType: reconciliationHistoryEventEnum('event_type').notNull(),
  actorUserId: uuid('actor_user_id')
    .notNull()
    .references(() => users.id),
  beforeSnapshot: jsonb('before_snapshot'),
  afterSnapshot: jsonb('after_snapshot').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
