import { integer, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { groupMemberRoleEnum, groupStatusEnum } from './enums';
import { borrowers } from './borrowers';
import { users } from './users';

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey(),
  systemId: text('system_id').notNull().unique(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  community: text('community').notNull(),
  status: groupStatusEnum('status').notNull().default('ACTIVE'),
  collectorUserId: uuid('collector_user_id').references(() => users.id),
  leaderBorrowerId: uuid('leader_borrower_id').references(() => borrowers.id),
  formedAt: timestamp('formed_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const groupMembers = pgTable(
  'group_members',
  {
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    borrowerId: uuid('borrower_id')
      .notNull()
      .references(() => borrowers.id),
    role: groupMemberRoleEnum('role').notNull().default('MEMBER'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    removedAt: timestamp('removed_at', { withTimezone: true }),
    version: integer('version').notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.groupId, table.borrowerId] })],
);

export const groupFormationQueue = pgTable(
  'group_formation_queue',
  {
    community: text('community').notNull(),
    borrowerId: uuid('borrower_id')
      .notNull()
      .references(() => borrowers.id),
    fullName: text('full_name').notNull(),
    approvedAt: timestamp('approved_at', { withTimezone: true }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.community, table.borrowerId] })],
);

export const groupSequenceCounters = pgTable('group_sequence_counters', {
  monthKey: text('month_key').primaryKey(),
  lastSequence: integer('last_sequence').notNull().default(0),
});
