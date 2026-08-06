import {
  bigint,
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { borrowers } from './borrowers';
import { groups } from './groups';
import { loans } from './loans';
import { users } from './users';

export const borrowerRelocations = pgTable('borrower_relocations', {
  id: uuid('id').primaryKey(),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  fromCommunity: text('from_community').notNull(),
  toCommunity: text('to_community').notNull(),
  fromDistrict: text('from_district'),
  toDistrict: text('to_district'),
  fromConstituency: text('from_constituency'),
  toConstituency: text('to_constituency'),
  fromCollectorUserId: uuid('from_collector_user_id').references(() => users.id),
  toCollectorUserId: uuid('to_collector_user_id').references(() => users.id),
  reason: text('reason').notNull(),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const loanScheduleChanges = pgTable('loan_schedule_changes', {
  id: uuid('id').primaryKey(),
  loanId: uuid('loan_id')
    .notNull()
    .references(() => loans.id),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  status: text('status').notNull().default('PENDING'),
  fromPaymentDay: text('from_payment_day').notNull(),
  toPaymentDay: text('to_payment_day').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  reason: text('reason').notNull(),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
  reviewNote: text('review_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groupMemberReplacements = pgTable('group_member_replacements', {
  id: uuid('id').primaryKey(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id),
  outgoingBorrowerId: uuid('outgoing_borrower_id')
    .notNull()
    .references(() => borrowers.id),
  incomingBorrowerId: uuid('incoming_borrower_id')
    .notNull()
    .references(() => borrowers.id),
  status: text('status').notNull().default('PENDING'),
  reason: text('reason').notNull(),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  approvedByUserId: uuid('approved_by_user_id').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const groupDissolutions = pgTable('group_dissolutions', {
  id: uuid('id').primaryKey(),
  groupId: uuid('group_id')
    .notNull()
    .references(() => groups.id),
  reason: text('reason').notNull(),
  outstandingPesewas: bigint('outstanding_pesewas', { mode: 'number' }).notNull().default(0),
  memberCount: integer('member_count').notNull().default(0),
  requestedByUserId: uuid('requested_by_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authLoginEvents = pgTable('auth_login_events', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  email: text('email').notNull(),
  success: boolean('success').notNull(),
  failureReason: text('failure_reason'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
