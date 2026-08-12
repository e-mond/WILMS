import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { locationSyncStatusEnum } from './enums';

export const locationSyncLog = pgTable(
  'location_sync_log',
  {
    id: uuid('id').primaryKey(),
    datasetSource: text('dataset_source').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    importedAt: timestamp('imported_at', { withTimezone: true }).notNull().defaultNow(),
    regionsImported: integer('regions_imported').notNull().default(0),
    districtsImported: integer('districts_imported').notNull().default(0),
    communitiesImported: integer('communities_imported').notNull().default(0),
    status: locationSyncStatusEnum('status').notNull().default('PENDING'),
    notes: text('notes'),
  },
  (table) => ({
    importedAtIdx: index('location_sync_log_imported_at_idx').on(table.importedAt),
    statusIdx: index('location_sync_log_status_idx').on(table.status),
    datasetIdx: index('location_sync_log_dataset_idx').on(table.datasetSource, table.datasetVersion),
  }),
);
