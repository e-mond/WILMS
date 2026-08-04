import { integer, numeric, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { scheduleWeekStatusEnum } from './enums';
import { loans } from './loans';

export const loanSchedules = pgTable(
  'loan_schedules',
  {
    loanId: uuid('loan_id')
      .notNull()
      .references(() => loans.id),
    weekNumber: integer('week_number').notNull(),
    dueDate: text('due_date').notNull(),
    installmentAmount: numeric('installment_amount', { precision: 15, scale: 2 }).notNull(),
    currencyCode: text('currency_code').notNull().default('GHS'),
    status: scheduleWeekStatusEnum('status').notNull().default('PENDING'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.loanId, table.weekNumber] })],
);
