import { eq, isNull } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { riskFlags } from '../../db/schema/risk-flags.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as userRepo from '../../repositories/user.repository.js';

export interface RiskFlagSummary {
  id: string;
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

function rowToSummary(row: typeof riskFlags.$inferSelect): RiskFlagSummary {
  return {
    id: row.id,
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
  };
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
  const flags = rows.map(rowToSummary);

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

  const summary = rowToSummary(row);

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

  const db = getDb();
  await db.insert(riskFlags).values({
    id,
    entityId: input.entityId,
    entityName: input.entityName.trim(),
    entityType: input.entityType as typeof riskFlags.$inferInsert.entityType,
    flagType: input.flagType as typeof riskFlags.$inferInsert.flagType,
    community: input.community.trim(),
    officerName: input.officerName?.trim() ?? '—',
    raisedAt: now,
    arrearsPesewas: input.arrearsPesewas ?? 0,
    status: 'OPEN',
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
