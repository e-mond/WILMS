import { integer, jsonb, pgTable, text, timestamp, uuid, index } from 'drizzle-orm/pg-core';

/**
 * Transactional outbox for domain events (v1.4).
 * Insert in the same DB transaction as the money mutation; deliver asynchronously.
 */
export const domainOutbox = pgTable(
  'domain_outbox',
  {
    id: uuid('id').primaryKey(),
    eventType: text('event_type').notNull(),
    eventVersion: integer('event_version').notNull().default(1),
    aggregateType: text('aggregate_type').notNull(),
    aggregateId: text('aggregate_id').notNull(),
    payload: jsonb('payload').notNull(),
    correlationId: text('correlation_id'),
    status: text('status').notNull().default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    availableAt: timestamp('available_at', { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    lastError: text('last_error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('domain_outbox_status_available_idx').on(table.status, table.availableAt),
    index('domain_outbox_aggregate_idx').on(table.aggregateType, table.aggregateId),
  ],
);
