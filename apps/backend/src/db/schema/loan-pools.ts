import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { loanPoolStatusEnum, poolAllocationTypeEnum } from './enums';
import { groups } from './groups';
import { loans } from './loans';
import { users } from './users';

/**
 * Capital pool — funding bucket for regional lending programs.
 * Aggregates are denormalized for read performance; allocations are source of truth.
 */
export const loanPools = pgTable('loan_pools', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  region: text('region').notNull(),
  source: text('source').notNull(),
  capitalPesewas: integer('capital_pesewas').notNull(),
  disbursedPesewas: integer('disbursed_pesewas').notNull().default(0),
  collectedPesewas: integer('collected_pesewas').notNull().default(0),
  outstandingPesewas: integer('outstanding_pesewas').notNull().default(0),
  utilisationPercent: integer('utilisation_percent').notNull().default(0),
  status: loanPoolStatusEnum('status').notNull().default('ACTIVE'),
  groupCount: integer('group_count').notNull().default(0),
  cycleLabel: text('cycle_label').notNull(),
  lastReplenishedAt: timestamp('last_replenished_at', { withTimezone: true }).notNull(),
  repaymentRatePercent: numeric('repayment_rate_percent', { precision: 5, scale: 2 })
    .notNull()
    .default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
});

/**
 * Links lending groups to a pool. Borrowers participate via group membership.
 */
export const poolMemberships = pgTable(
  'pool_memberships',
  {
    poolId: uuid('pool_id')
      .notNull()
      .references(() => loanPools.id),
    groupId: uuid('group_id')
      .notNull()
      .references(() => groups.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.poolId, table.groupId] })],
);

/**
 * Append-only pool capital movements. Never update or delete rows — use compensating entries.
 */
export const poolAllocations = pgTable('pool_allocations', {
  id: uuid('id').primaryKey(),
  poolId: uuid('pool_id')
    .notNull()
    .references(() => loanPools.id),
  allocationType: poolAllocationTypeEnum('allocation_type').notNull(),
  amountPesewas: integer('amount_pesewas').notNull(),
  loanId: uuid('loan_id').references(() => loans.id),
  borrowerId: uuid('borrower_id'),
  paymentId: uuid('payment_id'),
  description: text('description').notNull(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
});
