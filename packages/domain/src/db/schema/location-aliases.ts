import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const locationAliases = pgTable(
  'location_aliases',
  {
    id: uuid('id').primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    alias: text('alias').notNull(),
    normalisedAlias: text('normalised_alias').notNull(),
    source: text('source').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    entityNormalisedUnique: uniqueIndex('location_aliases_entity_normalised_idx').on(
      table.entityType,
      table.entityId,
      table.normalisedAlias,
    ),
    entityIdIdx: index('location_aliases_entity_id_idx').on(table.entityId),
    normalisedIdx: index('location_aliases_normalised_alias_idx').on(table.normalisedAlias),
  }),
);
