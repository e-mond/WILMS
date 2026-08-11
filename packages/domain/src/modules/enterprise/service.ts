import { uuidv7 } from 'uuidv7';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
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

  const record = {
    id: uuidv7(),
    loanId: loan.id,
    borrowerId: loan.borrowerId,
    status: 'PENDING',
    fromPaymentDay: loan.paymentDay,
    toPaymentDay,
    effectiveFrom: input.effectiveFrom,
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

  return record;
}

export async function approveScheduleChange(input: {
  changeId: string;
  actorUserId: string;
  note?: string;
}) {
  let record =
    (memoryScheduleChanges.find((entry) => entry.id === input.changeId) as
      | Record<string, unknown>
      | undefined) ?? undefined;

  if (isDatabaseEnabled()) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(loanScheduleChanges)
      .where(eq(loanScheduleChanges.id, input.changeId))
      .limit(1);
    if (!row) {
      throw new Error('NOT_FOUND');
    }
    record = {
      id: row.id,
      loanId: row.loanId,
      borrowerId: row.borrowerId,
      toPaymentDay: row.toPaymentDay,
      effectiveFrom: row.effectiveFrom,
      reason: row.reason,
      status: row.status,
    };
  }

  if (!record) {
    throw new Error('NOT_FOUND');
  }
  if (record.status !== 'PENDING' && record.status !== 'REVIEWED') {
    throw new Error('VALIDATION:Schedule change is not awaiting approval.');
  }

  const loan = await loanRepo.findLoanById(String(record.loanId));
  if (!loan) {
    throw new Error('NOT_FOUND');
  }

  const holidays = normalizeHolidayDates((await listHolidays()).map((entry) => entry.holidayDate));
  const weeks = await scheduleRepo.listScheduleWeeks(loan.id);
  const recalculated = recalculatePendingDueDatesForPaymentDay({
    weeks,
    toPaymentDay: String(record.toPaymentDay),
    effectiveFrom: String(record.effectiveFrom),
    holidayDates: holidays,
  });

  if (isDatabaseEnabled()) {
    const db = getDb();
    for (const week of recalculated) {
      await scheduleRepo.updateScheduleWeekDueDate(
        {
          loanId: loan.id,
          weekNumber: week.weekNumber,
          dueDate: week.dueDate,
        },
        db,
      );
    }
    await db
      .update(loans)
      .set({ paymentDay: String(record.toPaymentDay), updatedAt: new Date() })
      .where(eq(loans.id, loan.id));
    await db
      .update(loanScheduleChanges)
      .set({
        status: 'APPROVED',
        approvedByUserId: input.actorUserId,
        reviewNote: input.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(loanScheduleChanges.id, String(record.id)));
  } else {
    record.status = 'APPROVED';
    record.approvedByUserId = input.actorUserId;
  }

  const borrower = await getBorrower(loan.borrowerId);
  if (borrower) {
    await emitScheduleChangedNotification({
      borrowerId: borrower.id,
      borrowerName: borrower.fullName,
      borrowerPhone: borrower.phone,
      borrowerEmail: borrower.profile?.email,
      loanId: loan.id,
      dueDate: recalculated[0]?.dueDate ?? String(record.effectiveFrom),
      note: `Payment day moved to ${String(record.toPaymentDay)}.`,
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
    nextDueDate: recalculated[0]?.dueDate ?? null,
  };
}

export async function reviewScheduleChange(input: {
  changeId: string;
  actorUserId: string;
  note?: string;
}) {
  if (isDatabaseEnabled()) {
    const db = getDb();
    const [row] = await db
      .select()
      .from(loanScheduleChanges)
      .where(eq(loanScheduleChanges.id, input.changeId))
      .limit(1);
    if (!row) {
      throw new Error('NOT_FOUND');
    }
    if (row.status !== 'PENDING') {
      throw new Error('VALIDATION:Only pending schedule changes can be reviewed.');
    }
    await db
      .update(loanScheduleChanges)
      .set({
        status: 'REVIEWED',
        reviewedByUserId: input.actorUserId,
        reviewNote: input.note?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(loanScheduleChanges.id, input.changeId));
    return { id: input.changeId, status: 'REVIEWED' as const };
  }

  const record = memoryScheduleChanges.find((entry) => entry.id === input.changeId);
  if (!record) {
    throw new Error('NOT_FOUND');
  }
  record.status = 'REVIEWED';
  record.reviewedByUserId = input.actorUserId;
  return { id: input.changeId, status: 'REVIEWED' as const };
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
