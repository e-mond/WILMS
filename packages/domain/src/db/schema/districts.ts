import {
  boolean,
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { regions } from './regions';

export const districts = pgTable(
  'districts',
  {
    id: uuid('id').primaryKey(),
    regionId: uuid('region_id')
      .notNull()
      .references(() => regions.id),
    code: text('code'),
    name: text('name').notNull(),
    category: text('category').notNull(),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    geometryRef: text('geometry_ref'),
    source: text('source').notNull(),
    sourceId: text('source_id').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    regionNameUnique: uniqueIndex('districts_region_name_idx').on(table.regionId, table.name),
    sourceIdUnique: uniqueIndex('districts_source_id_idx').on(table.source, table.sourceId),
    regionIdx: index('districts_region_id_idx').on(table.regionId),
    activeIdx: index('districts_is_active_idx').on(table.isActive),
    searchIdx: index('districts_name_idx').on(table.name),
  }),
);
