import { pgEnum } from 'drizzle-orm/pg-core';
import { BORROWER_GENDER, BORROWER_ID_TYPE, BORROWER_STATUS } from '@wilms/shared-contracts';
import { USER_ROLE } from '@wilms/shared-rbac';

export const borrowerStatusEnum = pgEnum('borrower_status', [
  BORROWER_STATUS.PENDING,
  BORROWER_STATUS.APPROVED,
  BORROWER_STATUS.AT_RISK,
  BORROWER_STATUS.DEFAULTED,
  BORROWER_STATUS.REJECTED,
  BORROWER_STATUS.BLACKLISTED,
]);

export const borrowerGenderEnum = pgEnum('borrower_gender', [
  BORROWER_GENDER.FEMALE,
  BORROWER_GENDER.MALE,
  BORROWER_GENDER.OTHER,
]);

export const borrowerIdTypeEnum = pgEnum('borrower_id_type', [
  BORROWER_ID_TYPE.GHANA_CARD,
  BORROWER_ID_TYPE.VOTER_ID,
  BORROWER_ID_TYPE.PASSPORT,
]);

export const userRoleEnum = pgEnum('user_role', [
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.COLLECTOR,
  USER_ROLE.REGISTRATION_OFFICER,
  USER_ROLE.APPROVER,
  USER_ROLE.AUDITOR,
]);

export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INVITED', 'SUSPENDED']);

export const paymentStatusEnum = pgEnum('payment_status', ['CONFIRMED', 'PENDING_SYNC']);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'FUEL',
  'TRANSPORT',
  'AIRTIME',
  'FIELD_OPERATIONS',
  'OFFICE',
  'COMMUNITY_MEETINGS',
  'OTHER',
]);

export const expenseStatusEnum = pgEnum('expense_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const notificationChannelEnum = pgEnum('notification_channel', ['SMS', 'EMAIL']);

export const notificationEventEnum = pgEnum('notification_event', [
  'REGISTRATION_APPROVED',
  'REGISTRATION_REJECTED',
  'LOAN_DISBURSED',
  'PAYMENT_RECEIVED',
  'PAYMENT_REMINDER',
  'MISSED_PAYMENT',
  'DEFAULTER_STATUS',
  'LOAN_COMPLETED',
  'GUARANTOR_ALERT',
  'SUPERVISOR_ALERT',
]);

export const notificationSeverityEnum = pgEnum('notification_severity', [
  'INFO',
  'WARNING',
  'CRITICAL',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'BORROWER_REGISTERED',
  'BORROWER_APPROVED',
  'BORROWER_REJECTED',
  'BORROWER_BLACKLISTED',
  'PAYMENT_RECORDED',
  'PAYMENT_EDITED',
  'OVERPAYMENT_FLAGGED',
  'OVERPAYMENT_REVIEWED',
  'ADJUSTMENT_REQUESTED',
  'ADJUSTMENT_APPROVED',
  'ADJUSTMENT_REJECTED',
  'RECONCILIATION_SUBMITTED',
  'USER_LOGGED_OUT',
  'GROUP_FLAGGED',
  'GROUP_COLLECTOR_REASSIGNED',
  'GROUP_MEMBER_ADDED',
  'GROUP_MEMBER_REMOVED',
  'GROUP_LEADER_REPLACED',
  'GROUP_ADJUSTMENT_RECORDED',
  'GROUP_DISPLAY_NAME_UPDATED',
  'RISK_FLAG_ESCALATED',
  'RISK_FLAG_RESOLVED',
  'RISK_FLAG_ASSIGNED',
  'RISK_FLAG_RAISED',
  'SETTINGS_EXPORTED',
  'LOAN_CREATED',
  'LOAN_APPROVED',
  'LOAN_REJECTED',
  'LOAN_DISBURSED',
  'LOAN_POOL_REPLENISHED',
]);

export const auditTargetEntityEnum = pgEnum('audit_target_entity', [
  'BORROWER',
  'PAYMENT',
  'RECONCILIATION',
  'ADJUSTMENT',
  'OVERPAYMENT_REVIEW',
  'USER',
  'GROUP',
  'RISK_FLAG',
  'SETTINGS',
  'LOAN',
  'LOAN_POOL',
]);

export const uploadPurposeEnum = pgEnum('upload_purpose', [
  'profile-photo',
  'borrower-photo',
  'guarantor-photo',
  'document',
  'registration-attachment',
  'signature',
  'thumbprint',
]);

export const groupStatusEnum = pgEnum('group_status', [
  'ACTIVE',
  'AT_RISK',
  'FLAGGED',
  'SUSPENDED',
]);

export const approvalDecisionEnum = pgEnum('approval_decision', [
  'APPROVED',
  'REJECTED',
  'BLACKLISTED',
]);

export const groupMemberRoleEnum = pgEnum('group_member_role', ['LEADER', 'MEMBER']);

export const loanLifecycleStatusEnum = pgEnum('loan_lifecycle_status', [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'PENDING_DISBURSEMENT',
  'DISBURSED',
  'ACTIVE',
  'COMPLETED',
  'DEFAULTED',
  'WRITTEN_OFF',
]);

export const loanExternalStatusEnum = pgEnum('loan_external_status', [
  'PENDING_DISBURSEMENT',
  'ACTIVE',
  'COMPLETED',
  'DEFAULTED',
  'WRITTEN_OFF',
]);

export const scheduleWeekStatusEnum = pgEnum('schedule_week_status', [
  'PENDING',
  'PAID',
  'MISSED',
  'OVERDUE',
]);

export const ledgerEntryTypeEnum = pgEnum('ledger_entry_type', [
  'LOAN_DISBURSEMENT',
  'REPAYMENT',
  'INTEREST_CHARGE',
  'PENALTY_CHARGE',
  'ADJUSTMENT',
]);

export const idempotencyScopeEnum = pgEnum('idempotency_scope', [
  'LOAN_DISBURSE',
  'PAYMENT_POST',
  'LOAN_CREATE',
  'ADJUSTMENT_CREATE',
  'ADJUSTMENT_APPROVE',
]);

export const loanPoolStatusEnum = pgEnum('loan_pool_status', [
  'ACTIVE',
  'NEAR_FULL',
  'LAUNCHING',
]);

export const poolAllocationTypeEnum = pgEnum('pool_allocation_type', [
  'DISBURSEMENT',
  'REPAYMENT',
  'REPLENISHMENT',
  'ADJUSTMENT',
]);

export const adjustmentTypeEnum = pgEnum('adjustment_type', [
  'PAYMENT_CORRECTION',
  'DISBURSEMENT_CORRECTION',
  'WRITE_OFF',
  'BALANCE_ADJUSTMENT',
]);

export const adjustmentStatusEnum = pgEnum('adjustment_status', [
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const adjustmentReasonCategoryEnum = pgEnum('adjustment_reason_category', [
  'FEE_CORRECTION',
  'INTEREST_CORRECTION',
  'ADMINISTRATIVE',
  'BALANCE_CORRECTION',
  'MANUAL_CORRECTION',
]);

export const adjustmentHistoryEventEnum = pgEnum('adjustment_history_event', [
  'CREATED',
  'APPROVED',
  'REJECTED',
  'LEDGER_POSTED',
]);
