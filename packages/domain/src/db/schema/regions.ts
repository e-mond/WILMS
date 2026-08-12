import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const regions = pgTable(
  'regions',
  {
    id: uuid('id').primaryKey(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    source: text('source').notNull(),
    sourceId: text('source_id').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    codeUnique: uniqueIndex('regions_code_idx').on(table.code),
    nameUnique: uniqueIndex('regions_name_idx').on(table.name),
    sourceIdUnique: uniqueIndex('regions_source_id_idx').on(table.source, table.sourceId),
    activeIdx: index('regions_is_active_idx').on(table.isActive),
  }),
);
