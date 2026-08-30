import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  formatBorrowerDisplayId,
  formatEntityDisplayId,
  formatGroupDisplayId,
  formatRiskFlagDisplayId,
} from '@wilms/shared-utils';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { borrowers } from '../../db/schema/borrowers.js';
import { groups, groupMembers } from '../../db/schema/groups.js';
import { loanSchedules } from '../../db/schema/loan-schedules.js';
import { loans } from '../../db/schema/loans.js';
import { riskFlags } from '../../db/schema/risk-flags.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as userRepo from '../../repositories/user.repository.js';

export interface RiskFlagSummary {
  id: string;
  displayId: string;
  entityId: string;
  entityDisplayId: string;
  entityName: string;
  entityType: string;
  groupName?: string;
  flagType: string;
  community: string;
  officerName: string;
  raisedAt: string;
  arrearsPesewas: number;
  status: string;
  weeksOverdue?: number;
  activeMembers?: number;
  totalMembers?: number;
}

export interface RiskFlagListResponse {
  generatedAt: string;
  summary: {
    openFlags: number;
    blacklisted: number;
    outstandingArrearsPesewas: number;
    highRiskBorrowers: number;
  };
  flags: RiskFlagSummary[];
  typeBreakdown: Array<{ flagType: string; label: string; count: number }>;
  recentBlacklists: Array<{ id: string; name: string; reason: string; blacklistedAt: string }>;
}

export interface RiskFlagDetail extends RiskFlagSummary {
  timeline: Array<{ id: string; message: string; recordedAt: string }>;
}

const FLAG_TYPE_LABELS: Record<string, string> = {
  MISSED_PAYMENT: 'Missed payment',
  DEFAULT: 'Default',
  FRAUD_SUSPICION: 'Fraud suspicion',
  DUPLICATE_ID: 'Duplicate ID',
  BLACKLISTED: 'Blacklisted',
};

interface BorrowerEnrichment {
  community: string;
  registeredAt: Date;
  groupId: string | null;
  groupName: string;
}

interface GroupEnrichment {
  name: string;
  displayName: string;
  systemId: string;
  formedAt: Date;
  activeMembers: number;
  totalMembers: number;
}

async function loadBorrowerEnrichment(
  borrowerIds: string[],
): Promise<Map<string, BorrowerEnrichment>> {
  const map = new Map<string, BorrowerEnrichment>();
  if (borrowerIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({
      id: borrowers.id,
      community: borrowers.community,
      registeredAt: borrowers.registeredAt,
      groupId: borrowers.groupId,
      groupName: borrowers.groupName,
    })
    .from(borrowers)
    .where(and(inArray(borrowers.id, borrowerIds), isNull(borrowers.deletedAt)));

  for (const row of rows) {
    map.set(row.id, {
      community: row.community,
      registeredAt: row.registeredAt,
      groupId: row.groupId,
      groupName: row.groupName,
    });
  }
  return map;
}

async function loadMissedWeeksByBorrower(
  borrowerIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (borrowerIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({
      borrowerId: loans.borrowerId,
      missedCount: sql<number>`COUNT(*)::int`,
    })
    .from(loanSchedules)
    .innerJoin(loans, eq(loanSchedules.loanId, loans.id))
    .where(
      and(
        inArray(loans.borrowerId, borrowerIds),
        eq(loanSchedules.status, 'MISSED'),
        isNull(loans.deletedAt),
      ),
    )
    .groupBy(loans.borrowerId);

  for (const row of rows) {
    map.set(row.borrowerId, Number(row.missedCount));
  }
  return map;
}

async function loadMissedArrearsByBorrower(
  borrowerIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (borrowerIds.length === 0) return map;

  const db = getDb();
  const rows = await db
    .select({
      borrowerId: loans.borrowerId,
      arrearsPesewas: sql<number>`COALESCE(ROUND(SUM(${loanSchedules.installmentAmount}::numeric) * 100), 0)::int`,
    })
    .from(loanSchedules)
    .innerJoin(loans, eq(loanSchedules.loanId, loans.id))
    .where(
      and(
        inArray(loans.borrowerId, borrowerIds),
        eq(loanSchedules.status, 'MISSED'),
        isNull(loans.deletedAt),
      ),
    )
    .groupBy(loans.borrowerId);

  for (const row of rows) {
    map.set(row.borrowerId, Number(row.arrearsPesewas));
  }
  return map;
}

async function loadGroupEnrichment(groupIds: string[]): Promise<Map<string, GroupEnrichment>> {
  const map = new Map<string, GroupEnrichment>();
  if (groupIds.length === 0) return map;

  const db = getDb();
  const groupRows = await db
    .select({
      id: groups.id,
      name: groups.name,
      displayName: groups.displayName,
      systemId: groups.systemId,
      formedAt: groups.formedAt,
    })
    .from(groups)
    .where(and(inArray(groups.id, groupIds), isNull(groups.deletedAt)));

  const memberRows = await db
    .select({
      groupId: groupMembers.groupId,
      totalMembers: count().as('total_members'),
      activeMembers: sql<number>`COUNT(*) FILTER (WHERE ${groupMembers.removedAt} IS NULL)::int`,
    })
    .from(groupMembers)
    .where(inArray(groupMembers.groupId, groupIds))
    .groupBy(groupMembers.groupId);

  const membersByGroup = new Map(
    memberRows.map((row) => [
      row.groupId,
      {
        totalMembers: Number(row.totalMembers),
        activeMembers: Number(row.activeMembers),
      },
    ]),
  );

  for (const row of groupRows) {
    const members = membersByGroup.get(row.id) ?? { totalMembers: 0, activeMembers: 0 };
    map.set(row.id, {
      name: row.name,
      displayName: row.displayName || row.name,
      systemId: row.systemId,
      formedAt: row.formedAt,
      activeMembers: members.activeMembers,
      totalMembers: members.totalMembers,
    });
  }
  return map;
}

async function rowToSummary(row: typeof riskFlags.$inferSelect): Promise<RiskFlagSummary> {
  const [enriched] = await enrichFlagRows([row]);
  return enriched!;
}

async function enrichFlagRows(
  rows: Array<typeof riskFlags.$inferSelect>,
): Promise<RiskFlagSummary[]> {
  try {
    return await enrichFlagRowsUnsafe(rows);
  } catch {
    return rows.map((row) => ({
      id: row.id,
      displayId: formatRiskFlagDisplayId({ id: row.id, raisedAt: row.raisedAt }),
      entityId: row.entityId,
      entityDisplayId: formatEntityDisplayId({
        entityType: row.entityType,
        entityId: row.entityId,
        entityName: row.entityName,
      }),
      entityName: row.entityName,
      entityType: row.entityType,
      groupName: row.groupName ?? undefined,
      flagType: row.flagType,
      community: row.community,
      officerName: row.officerName,
      raisedAt: row.raisedAt.toISOString(),
      arrearsPesewas: row.arrearsPesewas,
      status: row.status,
      weeksOverdue: row.weeksOverdue ?? undefined,
      activeMembers: row.activeMembers ?? undefined,
      totalMembers: row.totalMembers ?? undefined,
    }));
  }
}

async function enrichFlagRowsUnsafe(
  rows: Array<typeof riskFlags.$inferSelect>,
): Promise<RiskFlagSummary[]> {
  const borrowerIds = rows
    .filter((row) => row.entityType === 'BORROWER')
    .map((row) => row.entityId);
  const groupEntityIds = rows
    .filter((row) => row.entityType === 'GROUP')
    .map((row) => row.entityId);

  const borrowersById = await loadBorrowerEnrichment(borrowerIds);
  const missedByBorrower = await loadMissedWeeksByBorrower(borrowerIds);
  const arrearsByBorrower = await loadMissedArrearsByBorrower(borrowerIds);

  const relatedGroupIds = [
    ...groupEntityIds,
    ...[...borrowersById.values()].map((b) => b.groupId).filter((id): id is string => Boolean(id)),
  ];
  const groupsById = await loadGroupEnrichment([...new Set(relatedGroupIds)]);

  return rows.map((row) => {
    const displayId = formatRiskFlagDisplayId({ id: row.id, raisedAt: row.raisedAt });
    let entityDisplayId = formatEntityDisplayId({
      entityType: row.entityType,
      entityId: row.entityId,
      entityName: row.entityName,
    });
    let groupName = row.groupName ?? undefined;
    let weeksOverdue = row.weeksOverdue ?? undefined;
    let activeMembers = row.activeMembers ?? undefined;
    let totalMembers = row.totalMembers ?? undefined;
    let arrearsPesewas = row.arrearsPesewas;

    if (row.entityType === 'BORROWER') {
      const borrower = borrowersById.get(row.entityId);
      if (borrower) {
        entityDisplayId = formatBorrowerDisplayId({
          community: borrower.community,
          registeredAt: borrower.registeredAt.toISOString(),
          id: row.entityId,
        });
        if (!groupName && borrower.groupName) {
          groupName = borrower.groupName;
        }
        if (weeksOverdue == null) {
          const missed = missedByBorrower.get(row.entityId);
          if (missed != null && missed > 0) {
            weeksOverdue = missed;
          }
        }
        const liveArrears = arrearsByBorrower.get(row.entityId);
        if (liveArrears != null && liveArrears > 0) {
          arrearsPesewas = liveArrears;
        } else if (arrearsPesewas <= 0) {
          // Fall back to outstanding loan balance when schedule installments are unavailable.
          arrearsPesewas = row.arrearsPesewas;
        }
        if (
          (activeMembers == null || totalMembers == null) &&
          borrower.groupId &&
          groupsById.has(borrower.groupId)
        ) {
          const group = groupsById.get(borrower.groupId)!;
          activeMembers = activeMembers ?? group.activeMembers;
          totalMembers = totalMembers ?? group.totalMembers;
          groupName = groupName ?? group.displayName;
        }
      }
    }

    if (row.entityType === 'GROUP') {
      const group = groupsById.get(row.entityId);
      if (group) {
        entityDisplayId = formatGroupDisplayId({
          systemId: group.systemId,
          createdAt: group.formedAt.toISOString(),
        });
        groupName = groupName ?? group.displayName;
        activeMembers = activeMembers ?? group.activeMembers;
        totalMembers = totalMembers ?? group.totalMembers;
      }
    }

    return {
      id: row.id,
      displayId,
      entityId: row.entityId,
      entityDisplayId,
      entityName: row.entityName,
      entityType: row.entityType,
      groupName,
      flagType: row.flagType,
      community: row.community,
      officerName: row.officerName,
      raisedAt: row.raisedAt.toISOString(),
      arrearsPesewas,
      status: row.status,
      weeksOverdue,
      activeMembers,
      totalMembers,
    };
  });
}

export async function listRiskFlags(): Promise<RiskFlagListResponse> {
  if (!isDatabaseEnabled()) {
    return {
      generatedAt: new Date().toISOString(),
      summary: {
        openFlags: 0,
        blacklisted: 0,
        outstandingArrearsPesewas: 0,
        highRiskBorrowers: 0,
      },
      flags: [],
      typeBreakdown: Object.entries(FLAG_TYPE_LABELS).map(([flagType, label]) => ({
        flagType,
        label,
        count: 0,
      })),
      recentBlacklists: [],
    };
  }

  const db = getDb();
  const rows = await db.select().from(riskFlags).where(isNull(riskFlags.deletedAt));
  const flags = await enrichFlagRows(rows);

  const openFlags = flags.filter(
    (flag) => flag.status === 'OPEN' || flag.status === 'UNDER_REVIEW' || flag.status === 'CRITICAL',
  );

  const typeCounts = new Map<string, number>();
  for (const flag of flags) {
    typeCounts.set(flag.flagType, (typeCounts.get(flag.flagType) ?? 0) + 1);
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      openFlags: openFlags.length,
      blacklisted: flags.filter((flag) => flag.flagType === 'BLACKLISTED').length,
      outstandingArrearsPesewas: flags.reduce((sum, flag) => sum + flag.arrearsPesewas, 0),
      highRiskBorrowers: flags.filter((flag) => flag.entityType === 'BORROWER').length,
    },
    flags,
    typeBreakdown: Object.entries(FLAG_TYPE_LABELS).map(([flagType, label]) => ({
      flagType,
      label,
      count: typeCounts.get(flagType) ?? 0,
    })),
    recentBlacklists: flags
      .filter((flag) => flag.flagType === 'BLACKLISTED')
      .slice(0, 5)
      .map((flag) => ({
        id: flag.id,
        name: flag.entityName,
        reason: flag.flagType,
        blacklistedAt: flag.raisedAt,
      })),
  };
}

export async function getRiskFlag(id: string): Promise<RiskFlagDetail> {
  if (!isDatabaseEnabled()) {
    throw new Error('NOT_FOUND');
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(riskFlags)
    .where(eq(riskFlags.id, id))
    .limit(1);

  if (!row || row.deletedAt) {
    throw new Error('NOT_FOUND');
  }

  const summary = await rowToSummary(row);

  return {
    ...summary,
    timeline: [
      {
        id: `${row.id}-raised`,
        message: row.reason ?? `${summary.flagType} flag raised`,
        recordedAt: summary.raisedAt,
      },
    ],
  };
}

function requireDatabase(): void {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required for risk flag operations.');
  }
}

export interface CreateRiskFlagInput {
  entityId: string;
  entityName: string;
  entityType: string;
  flagType: string;
  community: string;
  reason?: string;
  officerName?: string;
  arrearsPesewas?: number;
}

export async function createRiskFlag(
  input: CreateRiskFlagInput,
  actorId: string,
  actorDisplayName?: string,
): Promise<RiskFlagDetail> {
  requireDatabase();

  const id = uuidv7();
  const now = new Date();

  let groupName: string | null = null;
  let weeksOverdue: number | null = null;
  let activeMembers: number | null = null;
  let totalMembers: number | null = null;
  let arrearsPesewas = input.arrearsPesewas ?? 0;

  if (input.entityType === 'BORROWER') {
    try {
      const borrowersById = await loadBorrowerEnrichment([input.entityId]);
      const borrower = borrowersById.get(input.entityId);
      if (borrower) {
        groupName = borrower.groupName || null;
        const missed = await loadMissedWeeksByBorrower([input.entityId]);
        weeksOverdue = missed.get(input.entityId) ?? null;
        if (arrearsPesewas <= 0) {
          const arrears = await loadMissedArrearsByBorrower([input.entityId]);
          arrearsPesewas = arrears.get(input.entityId) ?? 0;
        }
        if (borrower.groupId) {
          const groupsById = await loadGroupEnrichment([borrower.groupId]);
          const group = groupsById.get(borrower.groupId);
          if (group) {
            groupName = group.displayName;
            activeMembers = group.activeMembers;
            totalMembers = group.totalMembers;
          }
        }
      }
    } catch {
      // Enrichment is best-effort at create time; list/get re-derives live values.
    }
  } else if (input.entityType === 'GROUP') {
    try {
      const groupsById = await loadGroupEnrichment([input.entityId]);
      const group = groupsById.get(input.entityId);
      if (group) {
        groupName = group.displayName;
        activeMembers = group.activeMembers;
        totalMembers = group.totalMembers;
      }
    } catch {
      // Best-effort.
    }
  }

  const db = getDb();
  await db.insert(riskFlags).values({
    id,
    entityId: input.entityId,
    entityName: input.entityName.trim(),
    entityType: input.entityType as typeof riskFlags.$inferInsert.entityType,
    groupName,
    flagType: input.flagType as typeof riskFlags.$inferInsert.flagType,
    community: input.community.trim(),
    officerName: input.officerName?.trim() ?? '—',
    raisedAt: now,
    arrearsPesewas,
    status: 'OPEN',
    weeksOverdue,
    activeMembers,
    totalMembers,
    reason: input.reason?.trim() ?? null,
  });

  appendAuditEntry({
    action: 'risk-flag.raised',
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'risk-flag',
    reason: input.reason,
  });

  return getRiskFlag(id);
}

export async function escalateRiskFlag(
  id: string,
  actorId: string,
  actorDisplayName?: string,
): Promise<RiskFlagDetail> {
  requireDatabase();

  const db = getDb();
  const [row] = await db
    .select()
    .from(riskFlags)
    .where(eq(riskFlags.id, id))
    .limit(1);

  if (!row || row.deletedAt) {
    throw new Error('NOT_FOUND');
  }

  if (row.status === 'RESOLVED') {
    throw new Error('VALIDATION:Resolved risk flags cannot be escalated.');
  }

  await db
    .update(riskFlags)
    .set({
      flagType: 'BLACKLISTED',
      status: 'CRITICAL',
      updatedAt: new Date(),
    })
    .where(eq(riskFlags.id, id));

  appendAuditEntry({
    action: 'risk-flag.escalated',
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'risk-flag',
  });

  return getRiskFlag(id);
}

export async function resolveRiskFlag(
  id: string,
  actorId: string,
  reason?: string,
  actorDisplayName?: string,
): Promise<RiskFlagDetail> {
  requireDatabase();

  const db = getDb();
  const [row] = await db
    .select()
    .from(riskFlags)
    .where(eq(riskFlags.id, id))
    .limit(1);

  if (!row || row.deletedAt) {
    throw new Error('NOT_FOUND');
  }

  await db
    .update(riskFlags)
    .set({
      status: 'RESOLVED',
      reason: reason?.trim() ?? row.reason,
      updatedAt: new Date(),
    })
    .where(eq(riskFlags.id, id));

  appendAuditEntry({
    action: 'risk-flag.resolved',
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'risk-flag',
    reason,
  });

  return getRiskFlag(id);
}

export async function assignRiskFlag(
  id: string,
  assignedToUserId: string,
  actorId: string,
  actorDisplayName?: string,
): Promise<RiskFlagDetail> {
  requireDatabase();

  const assignee = await userRepo.getUserById(assignedToUserId);
  if (!assignee) {
    throw new Error('VALIDATION:Assigned user not found.');
  }

  const db = getDb();
  const [row] = await db
    .select()
    .from(riskFlags)
    .where(eq(riskFlags.id, id))
    .limit(1);

  if (!row || row.deletedAt) {
    throw new Error('NOT_FOUND');
  }

  await db
    .update(riskFlags)
    .set({
      assignedToUserId,
      status: row.status === 'OPEN' ? 'UNDER_REVIEW' : row.status,
      updatedAt: new Date(),
    })
    .where(eq(riskFlags.id, id));

  appendAuditEntry({
    action: 'risk-flag.assigned',
    actorId,
    actorDisplayName,
    targetEntityId: id,
    targetEntityType: 'risk-flag',
    reason: `Assigned to ${assignee.displayName}`,
  });

  return getRiskFlag(id);
}
