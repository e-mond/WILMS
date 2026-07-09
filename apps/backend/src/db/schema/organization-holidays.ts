import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const organizationHolidays = pgTable('organization_holidays', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  holidayDate: text('holiday_date').notNull(),
  scope: text('scope').notNull().default('NATIONAL'),
  branch: text('branch'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
