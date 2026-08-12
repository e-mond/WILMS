import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { districts } from './districts';
import { subDistrictUnits } from './sub-district-units';

export const electoralAreas = pgTable(
  'electoral_areas',
  {
    id: uuid('id').primaryKey(),
    districtId: uuid('district_id')
      .notNull()
      .references(() => districts.id),
    subDistrictUnitId: uuid('sub_district_unit_id').references(() => subDistrictUnits.id),
    code: text('code'),
    name: text('name').notNull(),
    source: text('source').notNull(),
    sourceId: text('source_id').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    districtNameUnique: uniqueIndex('electoral_areas_district_name_idx').on(table.districtId, table.name),
    sourceIdUnique: uniqueIndex('electoral_areas_source_id_idx').on(table.source, table.sourceId),
    districtIdx: index('electoral_areas_district_id_idx').on(table.districtId),
    subUnitIdx: index('electoral_areas_sub_district_unit_id_idx').on(table.subDistrictUnitId),
    activeIdx: index('electoral_areas_is_active_idx').on(table.isActive),
    searchIdx: index('electoral_areas_name_idx').on(table.name),
  }),
);
