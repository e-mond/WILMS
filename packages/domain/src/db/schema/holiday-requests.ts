import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { organizationHolidays } from './organization-holidays.js';

export const holidayRequests = pgTable('holiday_requests', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  holidayDate: text('holiday_date').notNull(),
  endDate: text('end_date'),
  reason: text('reason'),
  scope: text('scope').notNull().default('NATIONAL'),
  branch: text('branch'),
  status: text('status').notNull().default('DRAFT'),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
  reviewNote: text('review_note'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  organizationHolidayId: text('organization_holiday_id').references(() => organizationHolidays.id),
  appliedAt: timestamp('applied_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
