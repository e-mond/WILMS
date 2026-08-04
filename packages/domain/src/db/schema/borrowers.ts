import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { approvalDecisionEnum, borrowerIdTypeEnum, borrowerStatusEnum } from './enums';
import { users } from './users';

export const borrowers = pgTable('borrowers', {
  id: uuid('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  idType: borrowerIdTypeEnum('id_type').notNull(),
  idNumber: text('id_number').notNull(),
  status: borrowerStatusEnum('status').notNull(),
  hasActiveLoan: boolean('has_active_loan').notNull().default(false),
  groupId: uuid('group_id'),
  groupName: text('group_name').notNull().default(''),
  community: text('community').notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull(),
  registeredByUserId: uuid('registered_by_user_id')
    .notNull()
    .references(() => users.id),
  rejectionReason: text('rejection_reason'),
  profile: jsonb('profile').notNull(),
  photoUploadId: uuid('photo_upload_id'),
  guarantorPhotoUploadId: uuid('guarantor_photo_upload_id'),
  idDocumentUploadId: uuid('id_document_upload_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const borrowerApprovalDecisions = pgTable('borrower_approval_decisions', {
  id: uuid('id').primaryKey(),
  borrowerId: uuid('borrower_id')
    .notNull()
    .references(() => borrowers.id),
  decision: approvalDecisionEnum('decision').notNull(),
  reason: text('reason'),
  decidedAt: timestamp('decided_at', { withTimezone: true }).notNull(),
  approverUserId: uuid('approver_user_id')
    .notNull()
    .references(() => users.id),
});
