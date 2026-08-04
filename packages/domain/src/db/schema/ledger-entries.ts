import { jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ledgerEntryTypeEnum } from './enums';
import { borrowers } from './borrowers';
import { loans } from './loans';
import { payments } from './payments';
import { users } from './users';
import { financialReversals } from './financial-reversals.js';

export const ledgerEntries = pgTable('ledger_entries', {
  id: uuid('id').primaryKey(),
  entryType: ledgerEntryTypeEnum('entry_type').notNull(),
  loanId: uuid('loan_id').references(() => loans.id),
  borrowerId: uuid('borrower_id').references(() => borrowers.id),
  paymentId: uuid('payment_id').references(() => payments.id),
  reversesLedgerEntryId: uuid('reverses_ledger_entry_id'),
  reversalId: uuid('reversal_id').references(() => financialReversals.id),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currencyCode: text('currency_code').notNull().default('GHS'),
  description: text('description'),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  metadata: jsonb('metadata'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
