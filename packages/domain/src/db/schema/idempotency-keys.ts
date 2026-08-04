import { integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { idempotencyScopeEnum } from './enums';
import { users } from './users';

export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').primaryKey(),
    scope: idempotencyScopeEnum('scope').notNull(),
    actorUserId: uuid('actor_user_id')
      .notNull()
      .references(() => users.id),
    idempotencyKey: text('idempotency_key').notNull(),
    requestHash: text('request_hash'),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    state: text('state').notNull().default('IN_PROGRESS'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idempotency_scope_actor_key_idx').on(
      table.scope,
      table.actorUserId,
      table.idempotencyKey,
    ),
  ],
);
