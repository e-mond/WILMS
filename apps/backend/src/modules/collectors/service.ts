import { and, eq, isNull, sql } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { financialReconciliations } from '../../db/schema/financial-reconciliations.js';
import { groups } from '../../db/schema/groups.js';
import { collectors, users } from '../../db/schema/users.js';
import { listPayments } from '../../db/persistence.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import { hashPassword } from '../../lib/password.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as userRepo from '../../repositories/user.repository.js';

export interface CollectorMonthlyPerformance {
  monthLabel: string;
  collectionRatePercent: number;
}

export interface CollectorSummary {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  zone: string;
  groupCount: number;
  borrowerCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  recoveryRatePercent: number;
  reconciliationCount: number;
  expensesSubmittedCount: number;
  status: 'ACTIVE' | 'AWAY';
  streakWeeks: number;
  cycleLabel: string;
  joinedAt: string;
  lastActiveAt: string;
  rateTrend: number[];
  monthlyPerformance: CollectorMonthlyPerformance[];
}

export interface CollectorListResponse {
  generatedAt: string;
  summary: {
    totalCollectors: number;
    avgCollectionRatePercent: number;
    belowSeventyPercent: number;
    activeToday: number;
  };
  rateDistribution: {
    topPerformers: number;
    onTrack: number;
    needsAttention: number;
  };
  collectors: CollectorSummary[];
  alerts: Array<{
    id: string;
    severity: 'danger' | 'warning' | 'success';
    message: string;
    createdAt: string;
  }>;
}

export interface CollectorDetail extends CollectorSummary {
  assignedGroups: Array<{
    id: string;
    name: string;
    memberCount: number;
    repaymentTrend: string;
    riskLevel: string;
  }>;
  recentCollections: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
  flagsRaised: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
  activityHistory: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
}

const EMPTY_MONTHLY: CollectorMonthlyPerformance[] = [
  { monthLabel: 'Jan', collectionRatePercent: 0 },
  { monthLabel: 'Feb', collectionRatePercent: 0 },
  { monthLabel: 'Mar', collectionRatePercent: 0 },
];

function buildCollectorSummary(input: {
  id: string;
  displayName: string;
  zone: string;
  groupCount: number;
  borrowerCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  reconciliationCount: number;
  joinedAt: string;
  lastActiveAt: string;
  status?: 'ACTIVE' | 'AWAY';
}): CollectorSummary {
  const collectionRatePercent =
    input.expectedPesewas === 0
      ? input.collectedPesewas > 0
        ? 100
        : 0
      : Math.round((input.collectedPesewas / input.expectedPesewas) * 100);

  return {
    id: input.id,
    displayName: input.displayName,
    photoUrl: null,
    zone: input.zone,
    groupCount: input.groupCount,
    borrowerCount: input.borrowerCount,
    expectedPesewas: input.expectedPesewas,
    collectedPesewas: input.collectedPesewas,
    collectionRatePercent,
    recoveryRatePercent: collectionRatePercent,
    reconciliationCount: input.reconciliationCount,
    expensesSubmittedCount: 0,
    status: input.status ?? 'ACTIVE',
    streakWeeks: 0,
    cycleLabel: 'Current cycle',
    joinedAt: input.joinedAt,
    lastActiveAt: input.lastActiveAt,
    rateTrend: [collectionRatePercent],
    monthlyPerformance: EMPTY_MONTHLY,
  };
}

async function loadGroupStatsByCollector(): Promise<
  Map<string, { groupCount: number; borrowerCount: number }>
> {
  const stats = new Map<string, { groupCount: number; borrowerCount: number }>();

  if (!isDatabaseEnabled()) {
    return stats;
  }

  const db = getDb();
  const rows = await db
    .select({
      collectorUserId: groups.collectorUserId,
      groupCount: sql<number>`count(*)::int`,
    })
    .from(groups)
    .where(isNull(groups.deletedAt))
    .groupBy(groups.collectorUserId);

  for (const row of rows) {
    if (!row.collectorUserId) {
      continue;
    }
    stats.set(row.collectorUserId, {
      groupCount: row.groupCount,
      borrowerCount: 0,
    });
  }

  return stats;
}

async function loadReconciliationCounts(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();

  if (!isDatabaseEnabled()) {
    return counts;
  }

  const db = getDb();
  const rows = await db
    .select({
      collectorUserId: financialReconciliations.collectorUserId,
      count: sql<number>`count(*)::int`,
    })
    .from(financialReconciliations)
    .groupBy(financialReconciliations.collectorUserId);

  for (const row of rows) {
    counts.set(row.collectorUserId, row.count);
  }

  return counts;
}

export async function listCollectors(): Promise<CollectorListResponse> {
  const today = new Date().toISOString().slice(0, 10);
  const payments = await listPayments();
  const [groupStats, reconciliationCounts] = await Promise.all([
    loadGroupStatsByCollector(),
    loadReconciliationCounts(),
  ]);

  let collectorEntries: Array<{
    id: string;
    displayName: string;
    zone: string;
    joinedAt: string;
    lastActiveAt: string;
    status: 'ACTIVE' | 'AWAY';
  }> = [];

  if (isDatabaseEnabled()) {
    const rows = await userRepo.listCollectors();
    collectorEntries = rows.map(({ user, collector }) => ({
      id: user.id,
      displayName: user.displayName,
      zone: user.zone ?? collector?.assignedRegion ?? '—',
      joinedAt: (collector?.joinedAt ?? user.createdAt).toISOString(),
      lastActiveAt: (collector?.lastActiveAt ?? user.lastLoginAt ?? user.updatedAt).toISOString(),
      status: collector?.status === 'AWAY' ? 'AWAY' : 'ACTIVE',
    }));
  } else {
    collectorEntries = DEMO_USERS.filter((user) => user.role === 'COLLECTOR').map((user) => ({
      id: user.id,
      displayName: user.displayName,
      zone: '—',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'ACTIVE' as const,
    }));
  }

  const collectors = collectorEntries.map((entry) => {
    const collectorPayments = payments.filter((payment) => payment.collectorId === entry.id);
    const collectedPesewas = collectorPayments.reduce((sum, payment) => sum + payment.amountPesewas, 0);
    const expectedPesewas = collectedPesewas;
    const groupInfo = groupStats.get(entry.id) ?? { groupCount: 0, borrowerCount: 0 };
    const activeToday = collectorPayments.some((payment) => payment.paymentDate === today);

    return {
      summary: buildCollectorSummary({
        id: entry.id,
        displayName: entry.displayName,
        zone: entry.zone,
        groupCount: groupInfo.groupCount,
        borrowerCount: groupInfo.borrowerCount,
        expectedPesewas,
        collectedPesewas,
        reconciliationCount: reconciliationCounts.get(entry.id) ?? 0,
        joinedAt: entry.joinedAt,
        lastActiveAt: entry.lastActiveAt,
        status: entry.status,
      }),
      activeToday,
    };
  });

  const summaries = collectors.map((entry) => entry.summary);
  const avgCollectionRatePercent =
    summaries.length === 0
      ? 0
      : Math.round(
          summaries.reduce((sum, collector) => sum + collector.collectionRatePercent, 0) /
            summaries.length,
        );

  const belowSeventyPercent = summaries.filter(
    (collector) => collector.collectionRatePercent < 70,
  ).length;
  const topPerformers = summaries.filter((collector) => collector.collectionRatePercent >= 90).length;
  const needsAttention = summaries.filter((collector) => collector.collectionRatePercent < 70).length;
  const onTrack = summaries.length - topPerformers - needsAttention;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCollectors: summaries.length,
      avgCollectionRatePercent,
      belowSeventyPercent,
      activeToday: collectors.filter((entry) => entry.activeToday).length,
    },
    rateDistribution: {
      topPerformers,
      onTrack: Math.max(onTrack, 0),
      needsAttention,
    },
    collectors: summaries,
    alerts: [],
  };
}

export async function getCollector(id: string): Promise<CollectorDetail> {
  const list = await listCollectors();
  const collector = list.collectors.find((entry) => entry.id === id);

  if (!collector) {
    throw new Error('NOT_FOUND');
  }

  let assignedGroups: CollectorDetail['assignedGroups'] = [];

  if (isDatabaseEnabled()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(groups)
      .where(and(eq(groups.collectorUserId, id), isNull(groups.deletedAt)));

    assignedGroups = rows.map((group) => ({
      id: group.id,
      name: group.displayName,
      memberCount: 0,
      repaymentTrend: 'Stable',
      riskLevel: group.status === 'AT_RISK' ? 'High' : 'Low',
    }));
  }

  const payments = (await listPayments())
    .filter((payment) => payment.collectorId === id)
    .slice(0, 5)
    .map((payment) => ({
      id: payment.id,
      message: `Collected payment on ${payment.paymentDate}`,
      tone: 'default' as const,
    }));

  return {
    ...collector,
    assignedGroups,
    recentCollections: payments,
    flagsRaised: [],
    activityHistory: payments,
  };
}

const DEFAULT_INVITE_PASSWORD = 'ChangeMe1!';

async function nextCollectorCode(): Promise<string> {
  const db = getDb();
  const rows = await db.select({ collectorCode: collectors.collectorCode }).from(collectors);
  let max = 0;
  for (const row of rows) {
    const match = /^COL-(\d+)$/.exec(row.collectorCode);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1]!, 10));
    }
  }
  return `COL-${String(max + 1).padStart(3, '0')}`;
}

export interface OnboardCollectorInput {
  displayName: string;
  email: string;
  zone: string;
  phone?: string;
  assignedRegion?: string;
}

export async function onboardCollector(
  input: OnboardCollectorInput,
  actorId: string,
  actorDisplayName?: string,
): Promise<CollectorDetail> {
  if (!isDatabaseEnabled()) {
    throw new Error('VALIDATION:Database persistence is required to onboard collectors.');
  }

  const displayName = input.displayName.trim();
  const email = input.email.trim().toLowerCase();
  const zone = input.zone.trim();

  if (!displayName) {
    throw new Error('VALIDATION:Display name is required.');
  }
  if (!email || !email.includes('@')) {
    throw new Error('VALIDATION:A valid email address is required.');
  }
  if (!zone) {
    throw new Error('VALIDATION:Zone is required.');
  }

  const existing = await userRepo.findUserByEmail(email);
  if (existing) {
    throw new Error('VALIDATION:A user with this email already exists.');
  }

  const userId = uuidv7();
  const collectorId = uuidv7();
  const collectorCode = await nextCollectorCode();
  const passwordHash = await hashPassword(DEFAULT_INVITE_PASSWORD);
  const now = new Date();

  const db = getDb();
  await db.insert(users).values({
    id: userId,
    email,
    passwordHash,
    displayName,
    phone: input.phone?.trim() ?? null,
    zone,
    region: input.assignedRegion?.trim() ?? null,
    role: USER_ROLE.COLLECTOR,
    status: 'INVITED',
  });

  await db.insert(collectors).values({
    id: collectorId,
    userId,
    collectorCode,
    assignedRegion: input.assignedRegion?.trim() ?? null,
    status: 'ACTIVE',
    joinedAt: now,
    lastActiveAt: now,
  });

  appendAuditEntry({
    action: 'collector.onboarded',
    actorId,
    actorDisplayName,
    targetEntityId: userId,
    targetEntityType: 'user',
    reason: `Onboarded collector ${collectorCode}`,
  });

  return getCollector(userId);
}
