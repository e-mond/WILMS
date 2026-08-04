import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { flagEntityTypeEnum, flagStatusEnum, flagTypeEnum } from './enums';
import { users } from './users';

export const riskFlags = pgTable('risk_flags', {
  id: uuid('id').primaryKey(),
  entityId: uuid('entity_id').notNull(),
  entityName: text('entity_name').notNull(),
  entityType: flagEntityTypeEnum('entity_type').notNull(),
  groupName: text('group_name'),
  flagType: flagTypeEnum('flag_type').notNull(),
  community: text('community').notNull(),
  officerName: text('officer_name').notNull().default('—'),
  raisedAt: timestamp('raised_at', { withTimezone: true }).notNull(),
  arrearsPesewas: integer('arrears_pesewas').notNull().default(0),
  status: flagStatusEnum('status').notNull().default('OPEN'),
  weeksOverdue: integer('weeks_overdue'),
  activeMembers: integer('active_members'),
  totalMembers: integer('total_members'),
  reason: text('reason'),
  assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
