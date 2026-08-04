import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const ghanaRegions = pgTable('ghana_regions', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ghanaDistricts = pgTable(
  'ghana_districts',
  {
    id: uuid('id').primaryKey(),
    regionId: uuid('region_id')
      .notNull()
      .references(() => ghanaRegions.id),
    name: text('name').notNull(),
    type: text('type').notNull(),
    code: text('code'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    regionNameUnique: uniqueIndex('ghana_districts_region_name_idx').on(table.regionId, table.name),
  }),
);

export const ghanaCities = pgTable(
  'ghana_cities',
  {
    id: uuid('id').primaryKey(),
    districtId: uuid('district_id')
      .notNull()
      .references(() => ghanaDistricts.id),
    name: text('name').notNull(),
    source: text('source').notNull().default('official'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    districtNameUnique: uniqueIndex('ghana_cities_district_name_idx').on(table.districtId, table.name),
  }),
);
