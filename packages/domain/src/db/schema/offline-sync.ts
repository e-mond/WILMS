import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './users';

export const offlineSyncOperations = pgTable(
  'offline_sync_operations',
  {
    id: uuid('id').primaryKey(),
    idempotencyKey: text('idempotency_key').notNull(),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id),
    operationType: text('operation_type').notNull(),
    payload: jsonb('payload').notNull(),
    clientCreatedAt: timestamp('client_created_at', { withTimezone: true }).notNull(),
    status: text('status').notNull().default('RECEIVED'),
    result: jsonb('result'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('offline_sync_idempotency_idx').on(table.actorUserId, table.idempotencyKey),
    index('offline_sync_status_idx').on(table.status),
  ],
);

export const offlineSyncConflicts = pgTable(
  'offline_sync_conflicts',
  {
    id: uuid('id').primaryKey(),
    operationId: uuid('operation_id')
      .notNull()
      .references(() => offlineSyncOperations.id),
    conflictReason: text('conflict_reason').notNull(),
    status: text('status').notNull().default('PENDING_REVIEW'),
    resolutionNote: text('resolution_note'),
    resolvedByUserId: uuid('resolved_by_user_id').references(() => users.id),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('offline_sync_conflicts_status_idx').on(table.status)],
);
