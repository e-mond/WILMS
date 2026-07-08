import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { borrowers } from './borrowers';
import { users } from './users';

export const borrowerAdminFees = pgTable('borrower_admin_fees', {
  borrowerId: uuid('borrower_id')
    .primaryKey()
    .references(() => borrowers.id, { onDelete: 'cascade' }),
  collectorUserId: uuid('collector_user_id')
    .notNull()
    .references(() => users.id),
  amountPesewas: integer('amount_pesewas').notNull(),
  transactionId: text('transaction_id').notNull(),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});
