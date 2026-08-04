import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { expenseCategoryEnum, expenseStatusEnum } from './enums';
import { users } from './users';

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey(),
  category: expenseCategoryEnum('category').notNull(),
  categoryLabel: text('category_label').notNull(),
  amountPesewas: integer('amount_pesewas').notNull(),
  expenseDate: text('expense_date').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  receiptUploadId: uuid('receipt_upload_id'),
  gpsLabel: text('gps_label'),
  recordedByUserId: uuid('recorded_by_user_id')
    .notNull()
    .references(() => users.id),
  status: expenseStatusEnum('status').notNull().default('PENDING'),
  reviewNote: text('review_note'),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
