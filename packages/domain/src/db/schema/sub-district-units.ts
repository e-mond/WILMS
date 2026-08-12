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
import { districts } from './districts';

export const subDistrictUnits = pgTable(
  'sub_district_units',
  {
    id: uuid('id').primaryKey(),
    districtId: uuid('district_id')
      .notNull()
      .references(() => districts.id),
    code: text('code'),
    name: text('name').notNull(),
    unitType: text('unit_type').notNull(),
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
    districtNameUnique: uniqueIndex('sub_district_units_district_name_idx').on(table.districtId, table.name),
    sourceIdUnique: uniqueIndex('sub_district_units_source_id_idx').on(table.source, table.sourceId),
    districtIdx: index('sub_district_units_district_id_idx').on(table.districtId),
    typeIdx: index('sub_district_units_unit_type_idx').on(table.unitType),
    activeIdx: index('sub_district_units_is_active_idx').on(table.isActive),
    searchIdx: index('sub_district_units_name_idx').on(table.name),
  }),
);
