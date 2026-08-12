import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const locationDataQualityRuns = pgTable(
  'location_data_quality_runs',
  {
    id: uuid('id').primaryKey(),
    ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
    status: text('status').notNull(),
    summary: jsonb('summary').notNull(),
    notes: text('notes'),
  },
  (table) => ({
    ranAtIdx: index('location_data_quality_runs_ran_at_idx').on(table.ranAt),
  }),
);
