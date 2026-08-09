import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const organizationHolidays = pgTable('organization_holidays', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  holidayDate: text('holiday_date').notNull(),
  scope: text('scope').notNull().default('NATIONAL'),
  branch: text('branch'),
  source: text('source').notNull().default('MANUAL'),
  enabled: boolean('enabled').notNull().default(true),
  year: integer('year'),
  externalKey: text('external_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
