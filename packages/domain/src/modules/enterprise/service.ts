import { uuidv7 } from 'uuidv7';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { isDatabaseEnabled, getDb, runInTransaction } from '../../db/client.js';
import {
  authLoginEvents,
  borrowerRelocations,
  groupDissolutions,
  groupMemberReplacements,
  loanScheduleChanges,
} from '../../db/schema/enterprise-workflows.js';
import { groupMembers, groups } from '../../db/schema/groups.js';
import { loans } from '../../db/schema/loans.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import { emitScheduleChangedNotification } from '../../infrastructure/notifications/ops-notifications.js';
import { notifyCollectorAssigned } from '../../infrastructure/notifications/event-dispatch.js';
import { createInAppNotification } from '../../infrastructure/notifications/in-app-notify.js';
import type { InAppEvent } from '../../infrastructure/notifications/in-app-notify.js';
import { resolveCollectorUserIdForBorrower } from '../../infrastructure/notifications/payment-notifications.js';
import { getBorrower, saveBorrower } from '../../db/persistence.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import * as userRepo from '../../repositories/user.repository.js';
import { listHolidays } from '../organization-holidays/service.js';
import { normalizeHolidayDates } from '../../domain/loan/holiday-shift.js';
import { recalculatePendingDueDatesForPaymentDay } from '../../domain/loan/schedule.js';
import { PAYMENT_DAY_OPTIONS } from '../../domain/loan/payment-day.js';
import { getGroupDetail, removeMember, validateMembershipRemoval } from '../groups/service.js';
import { decimalToPesewas } from '../../domain/money.js';
import { assignBorrowerToGroup } from '../../db/persistence.js';

const memoryRelocations: Array<Record<string, unknown>> = [];
const memoryScheduleChanges: Array<Record<string, unknown>> = [];
const memoryReplacements: Array<Record<string, unknown>> = [];
const memoryDissolutions: Array<Record<string, unknown>> = [];
const memoryLoginEvents: Array<Record<string, unknown>> = [];

export function __resetEnterpriseWorkflowMemoryForTests() {
  memoryRelocations.length = 0;
  memoryScheduleChanges.length = 0;
  memoryReplacements.length = 0;
  memoryDissolutions.length = 0;
  memoryLoginEvents.length = 0;
}

const SCHEDULE_CHANGE_HREF = '/ops/reassignment?tab=payment-day';
const APPROVER_SCHEDULE_CHANGE_HREF = '/approver/schedule-changes';

function assertIsoDate(value: string, label: string): string {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(`VALIDATION:${label} must be YYYY-MM-DD.`);
  }
  return trimmed;
}

async function notifyStaffInApp(input: {
  userId: string;
  title: string;
  body: string;
  href: string;
  event?: InAppEvent;
  borrowerId?: string;
  loanId?: string;
}): Promise<void> {
  try {
    await createInAppNotification({
      userId: input.userId,
      event: input.event ?? 'COMMUNICATION',
      title: input.title,
      body: input.body,
      href: input.href,
      borrowerId: input.borrowerId,
      loanId: input.loanId,
    });
  } catch {
    // Notification failure must not block workflow.
  }
}

async function notifyScheduleChangeSupervisors(input: {
  excludeUserId?: string;
  title: string;
  body: string;
  href?: string;
}): Promise<void> {
  if (!isDatabaseEnabled()) {
    return;
  }
  try {
    const staff = await userRepo.listUsers();
    const recipients = staff.filter(
      (user) =>
        user.status === 'ACTIVE' &&
        (user.role === USER_ROLE.SUPER_ADMIN || user.role === USER_ROLE.APPROVER) &&
        user.id !== input.excludeUserId,
    );
    await Promise.all(
      recipients.map((user) =>
        notifyStaffInApp({
          userId: user.id,
          event: 'SUPERVISOR_ALERT',
          title: input.title,
          body: input.body,
          href: input.href ?? SCHEDULE_CHANGE_HREF,
        }),
      ),
    );
  } catch {
    // Ignore notify failures.
  }
}

async function loadScheduleChangeRecord(changeId: string): Promise<Record<string, unknown> | undefined> {
  const memoryRecord = memoryScheduleChanges.find((entry) => entry.id === changeId);
  if (!isDatabaseEnabled()) {
    return memoryRecord;
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(loanScheduleChanges)
    .where(eq(loanScheduleChanges.id, changeId))
    .limit(1);
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    loanId: row.loanId,
    borrowerId: row.borrowerId,
    status: row.status,
    fromPaymentDay: row.fromPaymentDay,
    toPaymentDay: row.toPaymentDay,
    effectiveFrom: row.effectiveFrom,
    reason: row.reason,
    requestedByUserId: row.requestedByUserId,
    reviewedByUserId: row.reviewedByUserId,
    approvedByUserId: row.approvedByUserId,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function findActiveScheduleChangeForLoan(loanId: string): Promise<Record<string, unknown> | undefined> {
  if (!isDatabaseEnabled()) {
    return memoryScheduleChanges.find(
      (entry) =>
        entry.loanId === loanId && (entry.status === 'PENDING' || entry.status === 'REVIEWED'),
    );
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(loanScheduleChanges)
    .where(
      and(
        eq(loanScheduleChanges.loanId, loanId),
        sql`${loanScheduleChanges.status} in ('PENDING', 'REVIEWED')`,
      ),
    )
    .limit(1);
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    loanId: row.loanId,
    borrowerId: row.borrowerId,
    status: row.status,
    fromPaymentDay: row.fromPaymentDay,
    toPaymentDay: row.toPaymentDay,
    effectiveFrom: row.effectiveFrom,
    reason: row.reason,
    requestedByUserId: row.requestedByUserId,
    reviewedByUserId: row.reviewedByUserId,
    approvedByUserId: row.approvedByUserId,
    reviewNote: row.reviewNote,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function buildScheduleRecalculation(loanId: string, toPaymentDay: string, effectiveFrom: string) {
  const holidays = normalizeHolidayDates((await listHolidays()).map((entry) => entry.holidayDate));
  const weeks = await scheduleRepo.listScheduleWeeks(loanId);
  return recalculatePendingDueDatesForPaymentDay({
    weeks,
    toPaymentDay,
    effectiveFrom,
    holidayDates: holidays,
  });
}

export async function relocateBorrower(input: {
  borrowerId: string;
  community: string;
  district?: string;
  constituency?: string;
  collectorUserId?: string | null;
  reason: string;
  actorUserId: string;
}) {
  const reason = input.reason.trim();
  const community = input.community.trim();
  if (!reason || !community) {
    throw new Error('VALIDATION:Community and reason are required.');
  }

  const borrower = await getBorrower(input.borrowerId);
  if (!borrower) {
    throw new Error('NOT_FOUND');
  }

  const fromDistrict = String((borrower.profile as { district?: string })?.district ?? '');
  const fromConstituency = String(
    (borrower.profile as { constituency?: string })?.constituency ?? '',
  );
  const toDistrict = input.district?.trim() ?? fromDistrict;
  const toConstituency = input.constituency?.trim() ?? fromConstituency;

  let fromCollectorUserId: string | null = null;
  if (borrower.groupId && isDatabaseEnabled()) {
    const db = getDb();
    const [groupRow] = await db
      .select({ collectorUserId: groups.collectorUserId })
      .from(groups)
      .where(eq(groups.id, borrower.groupId))
      .limit(1);
    fromCollectorUserId = groupRow?.collectorUserId ?? null;
  }

  const updated = {
    ...borrower,
    community,
    profile: {
      ...borrower.profile,
      district: toDistrict,
      city: community,
      ...(toConstituency ? { constituency: toConstituency } : {}),
    },
    updatedAt: new Date().toISOString(),
  };
  await saveBorrower(updated);

  if (input.collectorUserId && borrower.groupId && isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({ collectorUserId: input.collectorUserId, updatedAt: new Date() })
      .where(eq(groups.id, borrower.groupId));
  }

  const relocation = {
    id: uuidv7(),
    borrowerId: borrower.id,
    fromCommunity: borrower.community,
    toCommunity: community,
    fromDistrict,
    toDistrict,
    fromConstituency,
    toConstituency,
    fromCollectorUserId,
    toCollectorUserId: input.collectorUserId ?? fromCollectorUserId,
    reason,
    requestedByUserId: input.actorUserId,
    createdAt: new Date().toISOString(),
  };

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(borrowerRelocations).values({
      id: relocation.id,
      borrowerId: relocation.borrowerId,
      fromCommunity: relocation.fromCommunity,
      toCommunity: relocation.toCommunity,
      fromDistrict: relocation.fromDistrict || null,
      toDistrict: relocation.toDistrict || null,
      fromConstituency: relocation.fromConstituency || null,
      toConstituency: relocation.toConstituency || null,
      fromCollectorUserId: relocation.fromCollectorUserId,
      toCollectorUserId: relocation.toCollectorUserId,
      reason: relocation.reason,
      requestedByUserId: relocation.requestedByUserId,
      createdAt: new Date(relocation.createdAt),
    });
  } else {
    memoryRelocations.push(relocation);
  }

  appendAuditEntry({
    action: 'BORROWER_RELOCATED',
    actorId: input.actorUserId,
    targetEntityId: borrower.id,
    targetEntityType: 'borrower',
    reason,
  });

  const notifyCollectorIds = new Set(
    [fromCollectorUserId, input.collectorUserId].filter(Boolean) as string[],
  );
  for (const collectorId of notifyCollectorIds) {
    const collector = await userRepo.getUserById(collectorId);
    if (collector) {
      void notifyCollectorAssigned({
        collectorEmail: collector.email,
        collectorName: collector.displayName,
        collectorUserId: collector.id,
        groupName: borrower.groupName || 'Borrower relocation',
        groupDisplayId: borrower.id,
        memberCount: 1,
      });
    }
  }

  return { borrower: updated, relocation };
}

export async function dissolveGroup(input: {
  groupId: string;
  reason: string;
  actorUserId: string;
  allowWithOutstanding?: boolean;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('VALIDATION:Dissolution reason is required.');
  }

  const detail = await getGroupDetail(input.groupId);
  const outstandingPesewas = Math.max(
    0,
    detail.disbursedPesewas - detail.collectedPesewas,
  );

  if (outstandingPesewas > 0 && !input.allowWithOutstanding) {
    throw new Error(
      `VALIDATION:Group still has outstanding obligations (GHS ${(outstandingPesewas / 100).toFixed(2)}). Settle, transfer, or confirm forced dissolution.`,
    );
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groups)
      .set({
        status: 'DISSOLVED',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(groups.id, input.groupId));
    await db
      .update(groupMembers)
      .set({ removedAt: new Date() })
      .where(and(eq(groupMembers.groupId, input.groupId), isNull(groupMembers.removedAt)));

    await db.insert(groupDissolutions).values({
      id: uuidv7(),
      groupId: input.groupId,
      reason,
      outstandingPesewas,
      memberCount: detail.memberCount,
      requestedByUserId: input.actorUserId,
    });
  } else {
    memoryDissolutions.push({
      id: uuidv7(),
      groupId: input.groupId,
      reason,
      outstandingPesewas,
      memberCount: detail.memberCount,
      requestedByUserId: input.actorUserId,
      createdAt: new Date().toISOString(),
    });
  }

  appendAuditEntry({
    action: 'GROUP_DISSOLVED',
    actorId: input.actorUserId,
    targetEntityId: input.groupId,
    targetEntityType: 'group',
    reason,
  });

  return {
    groupId: input.groupId,
    status: 'DISSOLVED' as const,
    outstandingPesewas,
    memberCount: detail.memberCount,
  };
}

export async function requestMemberReplacement(input: {
  groupId: string;
  outgoingBorrowerId: string;
  incomingBorrowerId: string;
  reason: string;
  actorUserId: string;
  autoApprove?: boolean;
}) {
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error('VALIDATION:Replacement reason is required.');
  }
  if (input.outgoingBorrowerId === input.incomingBorrowerId) {
    throw new Error('VALIDATION:Incoming and outgoing borrowers must differ.');
  }

  const validation = await validateMembershipRemoval({
    groupId: input.groupId,
    borrowerId: input.outgoingBorrowerId,
  });
  if (!validation.allowed && !validation.requiresApproval) {
    throw new Error(`VALIDATION:${validation.message}`);
  }

  const incoming = await getBorrower(input.incomingBorrowerId);
  if (!incoming) {
    throw new Error('NOT_FOUND');
  }

  const record = {
    id: uuidv7(),
    groupId: input.groupId,
    outgoingBorrowerId: input.outgoingBorrowerId,
    incomingBorrowerId: input.incomingBorrowerId,
    status: input.autoApprove || !validation.requiresApproval ? 'APPROVED' : 'PENDING',
    reason,
    requestedByUserId: input.actorUserId,
    approvedByUserId:
      input.autoApprove || !validation.requiresApproval ? input.actorUserId : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(groupMemberReplacements).values({
      id: record.id,
      groupId: record.groupId,
      outgoingBorrowerId: record.outgoingBorrowerId,
      incomingBorrowerId: record.incomingBorrowerId,
      status: record.status,
      reason: record.reason,
      requestedByUserId: record.requestedByUserId,
      approvedByUserId: record.approvedByUserId,
    });
  } else {
    memoryReplacements.push(record);
  }

  if (record.status === 'APPROVED') {
    await applyMemberReplacement(record.id, input.actorUserId);
  }

  appendAuditEntry({
    action: 'GROUP_MEMBER_REPLACEMENT_REQUESTED',
    actorId: input.actorUserId,
    targetEntityId: input.groupId,
    targetEntityType: 'group',
    reason,
  });

  return record;
}

export async function approveMemberReplacement(replacementId: string, actorUserId: string) {
  return applyMemberReplacement(replacementId, actorUserId);
}

async function applyMemberReplacement(replacementId: string, actorUserId: string) {
  let record =
    memoryReplacements.find((entry) => entry.id === replacementId) ??
    (null as null | Record<string, unknown>);

  if (isDatabaseEnabled()) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(groupMemberReplacements)
      .where(eq(groupMemberReplacements.id, replacementId))
      .limit(1);
    if (!row) {
      throw new Error('NOT_FOUND');
    }
    record = {
      id: row.id,
      groupId: row.groupId,
      outgoingBorrowerId: row.outgoingBorrowerId,
      incomingBorrowerId: row.incomingBorrowerId,
      status: row.status,
      reason: row.reason,
    };
  }

  if (!record) {
    throw new Error('NOT_FOUND');
  }

  await removeMember({
    groupId: String(record.groupId),
    borrowerId: String(record.outgoingBorrowerId),
  });

  const incoming = await getBorrower(String(record.incomingBorrowerId));
  if (!incoming) {
    throw new Error('NOT_FOUND');
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(groupMembers).values({
      groupId: String(record.groupId),
      borrowerId: String(record.incomingBorrowerId),
      role: 'MEMBER',
    });
  }

  const group = await getGroupDetail(String(record.groupId));
  await assignBorrowerToGroup(incoming.id, {
    id: group.id,
    systemId: group.groupSystemId,
    name: group.name,
    displayName: group.displayName || group.name,
    community: group.community,
    memberIds: group.members.map((member) => member.borrowerId),
    formedAt: group.formedAt,
  });

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(groupMemberReplacements)
      .set({
        status: 'APPROVED',
        approvedByUserId: actorUserId,
        updatedAt: new Date(),
      })
      .where(eq(groupMemberReplacements.id, replacementId));
  } else {
    record.status = 'APPROVED';
    record.approvedByUserId = actorUserId;
  }

  appendAuditEntry({
    action: 'GROUP_MEMBER_REPLACED',
    actorId: actorUserId,
    targetEntityId: String(record.groupId),
    targetEntityType: 'group',
    reason: String(record.reason ?? ''),
  });

  return getGroupDetail(String(record.groupId));
}

export async function requestScheduleChange(input: {
  loanId: string;
  toPaymentDay: string;
  effectiveFrom: string;
  reason: string;
  actorUserId: string;
}) {
  const reason = input.reason.trim();
  const toPaymentDay = input.toPaymentDay.trim();
  const effectiveFrom = assertIsoDate(input.effectiveFrom, 'Effective from');
  if (!reason || !toPaymentDay) {
    throw new Error('VALIDATION:Payment day and reason are required.');
  }
  if (!(PAYMENT_DAY_OPTIONS as readonly string[]).includes(toPaymentDay)) {
    throw new Error('VALIDATION:Invalid payment day.');
  }

  const loan = await loanRepo.findLoanById(input.loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }
  if (loan.externalStatus !== 'ACTIVE') {
    throw new Error('VALIDATION:Payment day changes are only allowed for active loans.');
  }
  if (loan.paymentDay === toPaymentDay) {
    throw new Error('VALIDATION:New payment day must differ from the current payment day.');
  }

  const existingPending = await findActiveScheduleChangeForLoan(loan.id);
  if (existingPending) {
    throw new Error(
      'CONFLICT:This loan already has a pending payment day change awaiting review or approval.',
    );
  }

  const record = {
    id: uuidv7(),
    loanId: loan.id,
    borrowerId: loan.borrowerId,
    status: 'PENDING',
    fromPaymentDay: loan.paymentDay,
    toPaymentDay,
    effectiveFrom,
    reason,
    requestedByUserId: input.actorUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(loanScheduleChanges).values({
      id: record.id,
      loanId: record.loanId,
      borrowerId: record.borrowerId,
      status: record.status,
      fromPaymentDay: record.fromPaymentDay,
      toPaymentDay: record.toPaymentDay,
      effectiveFrom: record.effectiveFrom,
      reason: record.reason,
      requestedByUserId: record.requestedByUserId,
    });
  } else {
    memoryScheduleChanges.push(record);
  }

  appendAuditEntry({
    action: 'LOAN_SCHEDULE_CHANGE_REQUESTED',
    actorId: input.actorUserId,
    targetEntityId: loan.id,
    targetEntityType: 'loan',
    reason,
  });

  await notifyScheduleChangeSupervisors({
    excludeUserId: input.actorUserId,
    title: 'Payment day change requested',
    body: `Loan ${loan.id}: ${loan.paymentDay} → ${toPaymentDay} from ${effectiveFrom}.`,
    href: APPROVER_SCHEDULE_CHANGE_HREF,
  });

  const collectorUserId = await resolveCollectorUserIdForBorrower(loan.borrowerId);
  if (collectorUserId && collectorUserId !== input.actorUserId) {
    await notifyStaffInApp({
      userId: collectorUserId,
      event: 'SUPERVISOR_ALERT',
      title: 'Payment day change requested',
      body: `A payment day change to ${toPaymentDay} was requested for one of your borrowers.`,
      href: SCHEDULE_CHANGE_HREF,
      borrowerId: loan.borrowerId,
      loanId: loan.id,
    });
  }

  return record;
}

export async function previewScheduleChange(input: {
  loanId: string;
  toPaymentDay: string;
  effectiveFrom: string;
}) {
  const toPaymentDay = input.toPaymentDay.trim();
  const effectiveFrom = assertIsoDate(input.effectiveFrom, 'Effective from');
  if (!(PAYMENT_DAY_OPTIONS as readonly string[]).includes(toPaymentDay)) {
    throw new Error('VALIDATION:Invalid payment day.');
  }

  const loan = await loanRepo.findLoanById(input.loanId);
  if (!loan) {
    throw new Error('NOT_FOUND');
  }
  if (loan.externalStatus !== 'ACTIVE') {
    throw new Error('VALIDATION:Payment day changes are only allowed for active loans.');
  }
  if (loan.paymentDay === toPaymentDay) {
    throw new Error('VALIDATION:New payment day must differ from the current payment day.');
  }

  const recalculated = await buildScheduleRecalculation(loan.id, toPaymentDay, effectiveFrom);
  return {
    loanId: loan.id,
    fromPaymentDay: loan.paymentDay,
    toPaymentDay,
    effectiveFrom,
    recalculatedWeeks: recalculated.length,
    nextDueDate: recalculated[0]?.dueDate ?? null,
    sampleWeeks: recalculated.slice(0, 5).map((week) => ({
      weekNumber: week.weekNumber,
      dueDate: week.dueDate,
    })),
  };
}

export async function getPendingScheduleChangeForLoan(loanId: string) {
  return (await findActiveScheduleChangeForLoan(loanId)) ?? null;
}

export async function approveScheduleChange(input: {
  changeId: string;
  actorUserId: string;
  note?: string;
}) {
  const record = await loadScheduleChangeRecord(input.changeId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }
  if (record.requestedByUserId === input.actorUserId) {
    throw new Error(
      'FORBIDDEN:You cannot approve a payment day change you requested. Ask another authorised reviewer.',
    );
  }
  if (record.reviewedByUserId === input.actorUserId) {
    throw new Error(
      'FORBIDDEN:You cannot approve a payment day change you reviewed. Ask another Super Admin to approve it.',
    );
  }
  if (record.status !== 'REVIEWED') {
    throw new Error(
      'VALIDATION:Schedule change must be reviewed before approval. Ask an authorised reviewer to review it first.',
    );
  }

  const loan = await loanRepo.findLoanById(String(record.loanId));
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const recalculated = await buildScheduleRecalculation(
    loan.id,
    String(record.toPaymentDay),
    String(record.effectiveFrom),
  );
  const nextDueDate = recalculated[0]?.dueDate ?? String(record.effectiveFrom);

  if (isDatabaseEnabled()) {
    await runInTransaction(async (tx) => {
      for (const week of recalculated) {
        await scheduleRepo.updateScheduleWeekDueDate(
          {
            loanId: loan.id,
            weekNumber: week.weekNumber,
            dueDate: week.dueDate,
          },
          tx,
        );
      }
      await tx
        .update(loans)
        .set({ paymentDay: String(record.toPaymentDay), updatedAt: new Date() })
        .where(eq(loans.id, loan.id));
      await tx
        .update(loanScheduleChanges)
        .set({
          status: 'APPROVED',
          approvedByUserId: input.actorUserId,
          reviewNote: input.note?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(loanScheduleChanges.id, String(record.id)));
    });
  } else {
    record.status = 'APPROVED';
    record.approvedByUserId = input.actorUserId;
  }

  const borrower = await getBorrower(loan.borrowerId);
  const collectorUserId = await resolveCollectorUserIdForBorrower(loan.borrowerId);
  if (borrower) {
    await emitScheduleChangedNotification({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile?.email,
      loanId: loan.id,
      dueDate: nextDueDate,
      paymentDay: String(record.toPaymentDay),
      weeklyAmountPesewas: Math.round(Number(loan.installmentAmount) * 100),
      note: `Payment day moved to ${String(record.toPaymentDay)}.`,
    });
  }

  if (collectorUserId) {
    await notifyStaffInApp({
      userId: collectorUserId,
      event: 'SCHEDULE_CHANGED',
      title: 'Payment day changed',
      body: `${borrower?.fullName ?? 'Borrower'}: payment day is now ${String(record.toPaymentDay)}. Next due: ${nextDueDate}.`,
      href: `/records/${loan.borrowerId}`,
      borrowerId: loan.borrowerId,
      loanId: loan.id,
    });
  }

  if (record.requestedByUserId && record.requestedByUserId !== input.actorUserId) {
    await notifyStaffInApp({
      userId: String(record.requestedByUserId),
      title: 'Payment day change approved',
      body: `${recalculated.length} future weeks recalculated. Next due: ${nextDueDate}.`,
      href: SCHEDULE_CHANGE_HREF,
      loanId: loan.id,
    });
  }

  appendAuditEntry({
    action: 'LOAN_SCHEDULE_CHANGE_APPROVED',
    actorId: input.actorUserId,
    targetEntityId: loan.id,
    targetEntityType: 'loan',
    reason: String(record.reason ?? ''),
  });

  return {
    ...record,
    status: 'APPROVED',
    recalculatedWeeks: recalculated.length,
    nextDueDate,
  };
}

export async function reviewScheduleChange(input: {
  changeId: string;
  actorUserId: string;
  note?: string;
}) {
  const record = await loadScheduleChangeRecord(input.changeId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }
  if (record.status !== 'PENDING') {
    throw new Error('VALIDATION:Only pending schedule changes can be reviewed.');
  }
  if (record.requestedByUserId === input.actorUserId) {
    throw new Error(
      'FORBIDDEN:You cannot review a payment day change you requested. Ask another authorised reviewer.',
    );
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(loanScheduleChanges)
      .set({
        status: 'REVIEWED',
        reviewedByUserId: input.actorUserId,
        reviewNote: input.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(loanScheduleChanges.id, input.changeId));
  } else {
    record.status = 'REVIEWED';
    record.reviewedByUserId = input.actorUserId;
  }

  appendAuditEntry({
    action: 'LOAN_SCHEDULE_CHANGE_REVIEWED',
    actorId: input.actorUserId,
    targetEntityId: String(record.loanId),
    targetEntityType: 'loan',
    reason: input.note?.trim() || String(record.reason ?? ''),
  });

  if (record.requestedByUserId) {
    await notifyStaffInApp({
      userId: String(record.requestedByUserId),
      title: 'Payment day change reviewed',
      body: `Your request (${String(record.fromPaymentDay)} → ${String(record.toPaymentDay)}) was reviewed and awaits Super Admin approval.`,
      href: SCHEDULE_CHANGE_HREF,
      loanId: String(record.loanId),
    });
  }

  await notifyScheduleChangeSupervisors({
    excludeUserId: input.actorUserId,
    title: 'Payment day change ready for approval',
    body: `Reviewed change ${String(record.fromPaymentDay)} → ${String(record.toPaymentDay)} awaits Super Admin approval.`,
    href: SCHEDULE_CHANGE_HREF,
  });

  return { id: input.changeId, status: 'REVIEWED' as const };
}

export async function rejectScheduleChange(input: {
  changeId: string;
  actorUserId: string;
  note?: string;
}) {
  const record = await loadScheduleChangeRecord(input.changeId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }
  if (record.status !== 'PENDING' && record.status !== 'REVIEWED') {
    throw new Error('VALIDATION:Only pending or reviewed schedule changes can be rejected.');
  }
  if (record.requestedByUserId === input.actorUserId) {
    throw new Error(
      'FORBIDDEN:You cannot reject a payment day change you requested. Ask another authorised reviewer.',
    );
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db
      .update(loanScheduleChanges)
      .set({
        status: 'REJECTED',
        reviewedByUserId: input.actorUserId,
        reviewNote: input.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(loanScheduleChanges.id, input.changeId));
  } else {
    record.status = 'REJECTED';
    record.reviewedByUserId = input.actorUserId;
  }

  appendAuditEntry({
    action: 'LOAN_SCHEDULE_CHANGE_REJECTED',
    actorId: input.actorUserId,
    targetEntityId: String(record.loanId),
    targetEntityType: 'loan',
    reason: input.note?.trim() || String(record.reason ?? ''),
  });

  if (record.requestedByUserId) {
    await notifyStaffInApp({
      userId: String(record.requestedByUserId),
      title: 'Payment day change rejected',
      body: `Your request (${String(record.fromPaymentDay)} → ${String(record.toPaymentDay)}) was rejected.`,
      href: SCHEDULE_CHANGE_HREF,
      loanId: String(record.loanId),
    });
  }

  return { id: input.changeId, status: 'REJECTED' as const };
}

export async function listPendingScheduleChanges() {
  if (!isDatabaseEnabled()) {
    return memoryScheduleChanges.filter((entry) => entry.status === 'PENDING' || entry.status === 'REVIEWED');
  }
  const db = getDb();
  return db
    .select()
    .from(loanScheduleChanges)
    .where(sql`${loanScheduleChanges.status} in ('PENDING', 'REVIEWED')`);
}

export async function recordLoginEvent(input: {
  userId?: string | null;
  email: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const event = {
    id: uuidv7(),
    userId: input.userId ?? null,
    email: input.email.toLowerCase(),
    success: input.success,
    failureReason: input.failureReason ?? null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ?? null,
    createdAt: new Date().toISOString(),
  };

  if (!isDatabaseEnabled()) {
    memoryLoginEvents.unshift(event);
    memoryLoginEvents.splice(500);
    return event;
  }

  const db = getDb();
  await db.insert(authLoginEvents).values({
    id: event.id,
    userId: event.userId,
    email: event.email,
    success: event.success,
    failureReason: event.failureReason,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
  });
  return event;
}

export async function listLoginEvents(userId?: string, limit = 50) {
  if (!isDatabaseEnabled()) {
    return memoryLoginEvents
      .filter((entry) => !userId || entry.userId === userId)
      .slice(0, limit);
  }
  const db = getDb();
  if (userId) {
    return db
      .select()
      .from(authLoginEvents)
      .where(eq(authLoginEvents.userId, userId))
      .orderBy(sql`${authLoginEvents.createdAt} desc`)
      .limit(limit);
  }
  return db
    .select()
    .from(authLoginEvents)
    .orderBy(sql`${authLoginEvents.createdAt} desc`)
    .limit(limit);
}

export async function buildWriteOffReport() {
  if (!isDatabaseEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalWriteOffs: 0,
        approvedCount: 0,
        pendingCount: 0,
        totalWrittenOffPesewas: 0,
      },
      rows: [] as Array<{
        id: string;
        loanId?: string;
        borrowerId?: string;
        amountPesewas: number;
        status: string;
        reason?: string;
        createdAt: string;
        decidedAt?: string;
      }>,
    };
  }

  const { listAdjustments } = await import('../adjustments/service.js');
  const list = await listAdjustments();
  const writeOffs = list.adjustments.filter((entry) => entry.type === 'WRITE_OFF');
  const approved = writeOffs.filter((entry) => entry.status === 'APPROVED');
  const pending = writeOffs.filter((entry) => entry.status === 'PENDING');
  const totalPesewas = approved.reduce((sum, entry) => sum + (entry.amountPesewas ?? 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalWriteOffs: writeOffs.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalWrittenOffPesewas: totalPesewas,
    },
    rows: writeOffs.map((entry) => ({
      id: entry.id,
      loanId: entry.loanId,
      borrowerId: entry.borrowerId,
      amountPesewas: entry.amountPesewas,
      status: entry.status,
      reason: entry.reason,
      createdAt: entry.requestedAt,
      decidedAt: entry.requestedAt,
    })),
  };
}

export async function buildAgingAnalysisReport() {
  if (!isDatabaseEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      summary: { current: 0, days1to7: 0, days8to30: 0, days31plus: 0 },
      rows: [] as Array<{
        loanId: string;
        borrowerId: string;
        outstandingPesewas: number;
        daysPastDue: number;
        bucket: 'current' | 'days1to7' | 'days8to30' | 'days31plus';
      }>,
    };
  }

  const activeLoans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
  const buckets = {
    current: 0,
    days1to7: 0,
    days8to30: 0,
    days31plus: 0,
  };
  const today = new Date().toISOString().slice(0, 10);
  const rows: Array<{
    loanId: string;
    borrowerId: string;
    outstandingPesewas: number;
    daysPastDue: number;
    bucket: keyof typeof buckets;
  }> = [];

  for (const loan of activeLoans) {
    const weeks = await scheduleRepo.listScheduleWeeks(loan.id);
    const overdue = weeks.filter(
      (week) => week.status === 'MISSED' || (week.status === 'PENDING' && week.dueDate < today),
    );
    if (overdue.length === 0) {
      buckets.current += 1;
      continue;
    }
    const oldest = overdue.map((week) => week.dueDate).sort()[0]!;
    const daysPastDue = Math.max(
      0,
      Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${oldest}T00:00:00Z`)) / 86400000),
    );
    const bucket =
      daysPastDue <= 7 ? 'days1to7' : daysPastDue <= 30 ? 'days8to30' : 'days31plus';
    buckets[bucket] += 1;
    rows.push({
      loanId: loan.id,
      borrowerId: loan.borrowerId,
      outstandingPesewas: decimalToPesewas(loan.loanBalance),
      daysPastDue,
      bucket,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: buckets,
    rows,
  };
}
