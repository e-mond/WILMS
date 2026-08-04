import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { auditActionEnum, auditTargetEntityEnum } from './enums';
import { users } from './users';

export const auditEntries = pgTable('audit_entries', {
  id: uuid('id').primaryKey(),
  action: auditActionEnum('action').notNull(),
  actorId: uuid('actor_id')
    .notNull()
    .references(() => users.id),
  actorDisplayName: text('actor_display_name'),
  targetEntityId: text('target_entity_id').notNull(),
  targetEntityType: auditTargetEntityEnum('target_entity_type').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
