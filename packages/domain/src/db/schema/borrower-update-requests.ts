import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { borrowers } from './borrowers.js';
import { users } from './users.js';

/**
 * Collector-initiated borrower data corrections.
 * Collectors cannot edit borrower records directly.
 */
export const borrowerUpdateRequests = pgTable(
  'borrower_update_requests',
  {
    id: uuid('id').primaryKey(),
    borrowerId: uuid('borrower_id')
      .notNull()
      .references(() => borrowers.id),
    field: text('field').notNull(),
    beforeValue: text('before_value').notNull().default(''),
    afterValue: text('after_value').notNull(),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('SUBMITTED'),
    requestedByUserId: uuid('requested_by_user_id')
      .notNull()
      .references(() => users.id),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    reviewNote: text('review_note'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    appliedAt: timestamp('applied_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    borrowerIdx: index('borrower_update_requests_borrower_id_idx').on(table.borrowerId),
    statusIdx: index('borrower_update_requests_status_idx').on(table.status),
    requesterIdx: index('borrower_update_requests_requested_by_idx').on(table.requestedByUserId),
  }),
);
