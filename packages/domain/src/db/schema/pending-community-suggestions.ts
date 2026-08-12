import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { locationSuggestionStatusEnum } from './enums';
import { districts } from './districts';
import { electoralAreas } from './electoral-areas';
import { users } from './users';

export const pendingCommunitySuggestions = pgTable(
  'pending_community_suggestions',
  {
    id: uuid('id').primaryKey(),
    districtId: uuid('district_id').references(() => districts.id),
    electoralAreaId: uuid('electoral_area_id').references(() => electoralAreas.id),
    proposedName: text('proposed_name').notNull(),
    proposedByUserId: uuid('proposed_by_user_id').references(() => users.id),
    status: locationSuggestionStatusEnum('status').notNull().default('PENDING'),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    districtIdx: index('pending_community_suggestions_district_id_idx').on(table.districtId),
    electoralAreaIdx: index('pending_community_suggestions_electoral_area_id_idx').on(
      table.electoralAreaId,
    ),
    statusIdx: index('pending_community_suggestions_status_idx').on(table.status),
    proposedNameIdx: index('pending_community_suggestions_name_idx').on(table.proposedName),
  }),
);
