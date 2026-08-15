import { and, eq, isNull, sql } from 'drizzle-orm';
import { USER_ROLE } from '@wilms/shared-rbac';
import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import { financialReconciliations } from '../../db/schema/financial-reconciliations.js';
import { groupMembers, groups } from '../../db/schema/groups.js';
import { collectors, users } from '../../db/schema/users.js';
import { listPayments } from '../../db/persistence.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import { DEMO_USERS } from '../../seed/demo-users.js';
import { hashPassword } from '../../lib/password.js';
import { generateInvitePassword } from '../../lib/invite-password.js';
import { appendAuditEntry } from '../../infrastructure/audit/audit-log.js';
import * as userRepo from '../../repositories/user.repository.js';
import { formatCollectorDisplayId } from '@wilms/shared-utils';
import {
  calculateStreakWeeks,
  collectionRatePercent,
  expectedForMonthPesewas,
  isoWeekKey,
  recentIsoWeekKeys,
  resolveTrendDirection,
  rollingMonthKeys,
  type CollectorTrendDirection,
} from './metrics.js';

export interface CollectorMonthlyPerformance {
  monthLabel: string;
  collectionRatePercent: number;
}

export interface CollectorSummary {
  id: string;
  displayId: string;
  displayName: string;
  photoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
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
  trendDirection: CollectorTrendDirection;
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
    groupSystemId?: string;
    name: string;
    memberCount: number;
    repaymentTrend: string;
    riskLevel: string;
  }>;
  recentCollections: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
  flagsRaised: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
  activityHistory: Array<{ id: string; message: string; tone: 'default' | 'danger' | 'muted' }>;
}

function buildCollectorSummary(input: {
  id: string;
  displayId: string;
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
  streakWeeks: number;
  trendDirection: CollectorTrendDirection;
  rateTrend: number[];
  monthlyPerformance: CollectorMonthlyPerformance[];
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
}): CollectorSummary {
  const rate = collectionRatePercent(input.collectedPesewas, input.expectedPesewas);

  return {
    id: input.id,
    displayId: input.displayId,
    displayName: input.displayName,
    photoUrl: input.photoUrl ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    zone: input.zone,
    groupCount: input.groupCount,
    borrowerCount: input.borrowerCount,
    expectedPesewas: input.expectedPesewas,
    collectedPesewas: input.collectedPesewas,
    collectionRatePercent: rate,
    recoveryRatePercent: rate,
    reconciliationCount: input.reconciliationCount,
    expensesSubmittedCount: 0,
    status: input.status ?? 'ACTIVE',
    streakWeeks: input.streakWeeks,
    trendDirection: input.trendDirection,
    cycleLabel: 'Current cycle',
    joinedAt: input.joinedAt,
    lastActiveAt: input.lastActiveAt,
    rateTrend: input.rateTrend,
    monthlyPerformance: input.monthlyPerformance,
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
  const groupRows = await db
    .select({
      collectorUserId: groups.collectorUserId,
      groupCount: sql<number>`count(*)::int`,
    })
    .from(groups)
    .where(isNull(groups.deletedAt))
    .groupBy(groups.collectorUserId);

  for (const row of groupRows) {
    if (!row.collectorUserId) {
      continue;
    }
    stats.set(row.collectorUserId, {
      groupCount: row.groupCount,
      borrowerCount: 0,
    });
  }

  const memberRows = await db.execute(sql`
    SELECT
      g.collector_user_id AS collector_id,
      COUNT(DISTINCT gm.borrower_id)::int AS borrower_count
    FROM groups g
    INNER JOIN group_members gm
      ON gm.group_id = g.id AND gm.removed_at IS NULL
    INNER JOIN borrowers b
      ON b.id = gm.borrower_id AND b.deleted_at IS NULL
    WHERE g.deleted_at IS NULL
      AND g.collector_user_id IS NOT NULL
      AND b.status IN ('APPROVED', 'AT_RISK', 'DEFAULTED')
    GROUP BY g.collector_user_id
  `);

  for (const row of memberRows.rows as { collector_id?: string; borrower_count?: number }[]) {
    if (!row.collector_id) {
      continue;
    }
    const existing = stats.get(row.collector_id) ?? { groupCount: 0, borrowerCount: 0 };
    stats.set(row.collector_id, {
      groupCount: existing.groupCount,
      borrowerCount: Number(row.borrower_count ?? 0),
    });
  }

  return stats;
}

async function loadMemberCountsByGroup(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (!isDatabaseEnabled()) {
    return counts;
  }

  const db = getDb();
  const rows = await db
    .select({
      groupId: groupMembers.groupId,
      memberCount: sql<number>`count(*)::int`,
    })
    .from(groupMembers)
    .where(isNull(groupMembers.removedAt))
    .groupBy(groupMembers.groupId);

  for (const row of rows) {
    counts.set(row.groupId, row.memberCount);
  }
  return counts;
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

async function loadPendingReconciliationAlerts(): Promise<
  Array<{ collectorUserId: string; date: string; submittedAt: Date }>
> {
  if (!isDatabaseEnabled()) {
    return [];
  }

  const db = getDb();
  const rows = await db
    .select({
      collectorUserId: financialReconciliations.collectorUserId,
      date: financialReconciliations.reconciliationDate,
      submittedAt: financialReconciliations.submittedAt,
      status: financialReconciliations.status,
      varianceFlagged: financialReconciliations.varianceFlagged,
    })
    .from(financialReconciliations)
    .orderBy(sql`${financialReconciliations.submittedAt} DESC`)
    .limit(20);

  return rows
    .filter(
      (row) =>
        row.status === 'PENDING_REVIEW' ||
        row.status === 'UNDER_INVESTIGATION' ||
        row.status === 'REOPENED' ||
        row.varianceFlagged,
    )
    .slice(0, 8)
    .map((row) => ({
      collectorUserId: row.collectorUserId,
      date: row.date,
      submittedAt: row.submittedAt,
    }));
}

function buildMonthlySeries(input: {
  now: Date;
  weeklyExpectedPesewas: number;
  monthlyCollected: Map<string, number> | undefined;
}): { monthlyPerformance: CollectorMonthlyPerformance[]; rateTrend: number[]; trendDirection: CollectorTrendDirection } {
  const months = rollingMonthKeys(input.now, 6);
  const monthlyPerformance = months.map((month) => {
    const monthStart = `${month.key}-01`;
    const collected = input.monthlyCollected?.get(month.key) ?? 0;
    const expected = expectedForMonthPesewas(input.weeklyExpectedPesewas, monthStart);
    return {
      monthLabel: month.label,
      collectionRatePercent: collectionRatePercent(collected, expected),
    };
  });
  const rateTrend = monthlyPerformance.map((entry) => entry.collectionRatePercent);
  const current = rateTrend[rateTrend.length - 1] ?? 0;
  const previous = rateTrend[rateTrend.length - 2] ?? current;
  return {
    monthlyPerformance,
    rateTrend,
    trendDirection: resolveTrendDirection(current, previous),
  };
}

function buildStreakWeeks(paymentDates: string[] | undefined, now: Date): number {
  if (!paymentDates?.length) {
    return 0;
  }
  const weekSet = new Set(paymentDates.map((date) => isoWeekKey(date)));
  return calculateStreakWeeks(recentIsoWeekKeys(now, 16), weekSet);
}

export async function listCollectors(): Promise<CollectorListResponse> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const useDb = isDatabaseEnabled();
  const sixMonthsAgo = rollingMonthKeys(now, 6)[0]!.key + '-01';
  const twelveWeeksAgo = new Date(now.getTime() - 16 * 7 * 86400000).toISOString().slice(0, 10);

  const [
    payments,
    paymentsByCollector,
    activeTodayCollectors,
    groupStats,
    reconciliationCounts,
    expectedByCollector,
    monthlyByCollector,
    paymentDatesByCollector,
    pendingRecons,
    recentPayments,
  ] = await Promise.all([
    useDb ? Promise.resolve([] as Awaited<ReturnType<typeof listPayments>>) : listPayments(),
    useDb ? paymentRepo.sumConfirmedPaymentsByCollector() : Promise.resolve(new Map<string, number>()),
    useDb ? paymentRepo.listCollectorIdsWithPaymentOnDate(today) : Promise.resolve(new Set<string>()),
    loadGroupStatsByCollector(),
    loadReconciliationCounts(),
    useDb ? loanRepo.sumExpectedWeeklyByCollector() : Promise.resolve(new Map<string, number>()),
    useDb
      ? paymentRepo.sumConfirmedPaymentsByCollectorMonth(sixMonthsAgo)
      : Promise.resolve(new Map<string, Map<string, number>>()),
    useDb
      ? paymentRepo.listConfirmedPaymentDatesByCollector(twelveWeeksAgo)
      : Promise.resolve(new Map<string, string[]>()),
    loadPendingReconciliationAlerts(),
    useDb ? paymentRepo.listRecentConfirmedPayments(8) : Promise.resolve([]),
  ]);

  let collectorEntries: Array<{
    id: string;
    displayId: string;
    displayName: string;
    zone: string;
    joinedAt: string;
    lastActiveAt: string;
    status: 'ACTIVE' | 'AWAY';
    phone?: string | null;
    email?: string | null;
    photoUploadId?: string | null;
  }> = [];

  if (isDatabaseEnabled()) {
    const rows = await userRepo.listCollectors();
    collectorEntries = rows.map(({ user, collector }, index) => ({
      id: user.id,
      displayId: formatCollectorDisplayId({
        collectorCode: collector?.collectorCode,
        staffId: user.staffId,
        sequence: index + 1,
      }),
      displayName: user.displayName,
      zone: user.zone ?? collector?.assignedRegion ?? '—',
      joinedAt: (collector?.joinedAt ?? user.createdAt).toISOString(),
      lastActiveAt: (collector?.lastActiveAt ?? user.lastLoginAt ?? user.updatedAt).toISOString(),
      status: collector?.status === 'AWAY' ? 'AWAY' : 'ACTIVE',
      phone: user.phone ?? null,
      email: user.email ?? null,
      photoUploadId: user.profileImageUploadId ?? null,
    }));
  } else {
    collectorEntries = DEMO_USERS.filter((user) => user.role === 'COLLECTOR').map((user, index) => ({
      id: user.id,
      displayId: formatCollectorDisplayId({ sequence: index + 1 }),
      displayName: user.displayName,
      zone: '—',
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      status: 'ACTIVE' as const,
    }));
  }

  const nameById = new Map(collectorEntries.map((entry) => [entry.id, entry.displayName]));

  const collectors = collectorEntries.map((entry) => {
    const collectedPesewas = useDb
      ? (paymentsByCollector.get(entry.id) ?? 0)
      : payments
          .filter((payment) => payment.collectorId === entry.id)
          .reduce((sum, payment) => sum + payment.amountPesewas, 0);
    const expectedPesewas = useDb
      ? (expectedByCollector.get(entry.id) ?? 0)
      : collectedPesewas;
    const groupInfo = groupStats.get(entry.id) ?? { groupCount: 0, borrowerCount: 0 };
    const activeToday = useDb
      ? activeTodayCollectors.has(entry.id)
      : payments
          .filter((payment) => payment.collectorId === entry.id)
          .some((payment) => payment.paymentDate === today);

    const series = buildMonthlySeries({
      now,
      weeklyExpectedPesewas: expectedPesewas,
      monthlyCollected: monthlyByCollector.get(entry.id),
    });
    const streakWeeks = buildStreakWeeks(paymentDatesByCollector.get(entry.id), now);

    return {
      summary: buildCollectorSummary({
        id: entry.id,
        displayId: entry.displayId,
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
        streakWeeks,
        trendDirection: series.trendDirection,
        rateTrend: series.rateTrend,
        monthlyPerformance: series.monthlyPerformance,
        phone: entry.phone ?? null,
        email: entry.email ?? null,
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

  const alerts: CollectorListResponse['alerts'] = [];

  for (const payment of recentPayments.slice(0, 5)) {
    const name = nameById.get(payment.collectorId) ?? 'Collector';
    alerts.push({
      id: `pay-${payment.id}`,
      severity: 'success',
      message: `${name} recorded a payment on ${payment.paymentDate}`,
      createdAt: payment.recordedAt,
    });
  }

  for (const recon of pendingRecons.slice(0, 4)) {
    const name = nameById.get(recon.collectorUserId) ?? 'Collector';
    alerts.push({
      id: `recon-${recon.collectorUserId}-${recon.date}`,
      severity: 'warning',
      message: `${name} submitted reconciliation for ${recon.date} awaiting review`,
      createdAt: recon.submittedAt.toISOString(),
    });
  }

  for (const collector of summaries) {
    if (collector.borrowerCount > 0 && collector.collectionRatePercent < 70) {
      alerts.push({
        id: `rate-${collector.id}`,
        severity: 'danger',
        message: `${collector.displayName} collection rate is ${collector.collectionRatePercent}% — needs attention`,
        createdAt: now.toISOString(),
      });
    }
  }

  alerts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    generatedAt: now.toISOString(),
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
    alerts: alerts.slice(0, 10),
  };
}

export async function getCollector(id: string): Promise<CollectorDetail> {
  const list = await listCollectors();
  const collector = list.collectors.find((entry) => entry.id === id);

  if (!collector) {
    throw new Error('NOT_FOUND');
  }

  let photoUrl = collector.photoUrl ?? null;
  if (isDatabaseEnabled()) {
    const user = await userRepo.getUserById(id);
    if (user?.profileImageUploadId) {
      const { resolveUploadAccessUrlById } = await import('../../infrastructure/uploads/index.js');
      photoUrl = (await resolveUploadAccessUrlById(user.profileImageUploadId)) ?? photoUrl;
    }
  }

  let assignedGroups: CollectorDetail['assignedGroups'] = [];
  const memberCounts = await loadMemberCountsByGroup();

  if (isDatabaseEnabled()) {
    const db = getDb();
    const rows = await db
      .select()
      .from(groups)
      .where(and(eq(groups.collectorUserId, id), isNull(groups.deletedAt)));

    assignedGroups = rows.map((group) => ({
      id: group.id,
      groupSystemId: group.systemId,
      name: group.displayName,
      memberCount: memberCounts.get(group.id) ?? 0,
      repaymentTrend: 'Stable',
      riskLevel: group.status === 'AT_RISK' ? 'High' : 'Low',
    }));
  }

  let recentPaymentRows: Array<{ id: string; paymentDate: string }> = [];

  if (isDatabaseEnabled()) {
    recentPaymentRows = (await paymentRepo.listRecentPaymentsForCollector(id, 5)).map((payment) => ({
      id: payment.id,
      paymentDate: payment.paymentDate,
    }));
  } else {
    recentPaymentRows = (await listPayments())
      .filter((payment) => payment.collectorId === id)
      .slice(0, 5)
      .map((payment) => ({ id: payment.id, paymentDate: payment.paymentDate }));
  }

  const payments = recentPaymentRows.map((payment) => ({
    id: payment.id,
    message: `Collected payment on ${payment.paymentDate}`,
    tone: 'default' as const,
  }));

  return {
    ...collector,
    photoUrl,
    assignedGroups,
    recentCollections: payments,
    flagsRaised: [],
    activityHistory: payments,
  };
}

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
  assignedDistrict?: string;
  assignedSubDistrictUnitId?: string;
  assignedElectoralAreaId?: string;
  assignedCommunityId?: string;
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
  const temporaryPassword = generateInvitePassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const now = new Date();
  const invitedAt = now;

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
    invitedAt,
  });

  await db.insert(collectors).values({
    id: collectorId,
    userId,
    collectorCode,
    assignedRegion: input.assignedRegion?.trim() ?? null,
    assignedDistrict: input.assignedDistrict?.trim() ?? null,
    assignedSubDistrictUnitId: input.assignedSubDistrictUnitId?.trim() ?? null,
    assignedElectoralAreaId: input.assignedElectoralAreaId?.trim() ?? null,
    assignedCommunityId: input.assignedCommunityId?.trim() ?? null,
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

  try {
    const { issueInvitationToken } = await import('../auth/invitation-token.service.js');
    const { notifyUserInvitation } = await import(
      '../../infrastructure/notifications/event-dispatch.js'
    );
    const { computeInvitationExpiresAt } = await import('../../lib/invitation-expiry.js');
    const expiresAt = computeInvitationExpiresAt(invitedAt);
    const issued = await issueInvitationToken({
      userId,
      expiresAt,
      actorUserId: actorId,
    });
    await notifyUserInvitation({
      email,
      displayName,
      temporaryPassword,
      userId,
      phone: input.phone?.trim(),
      expiresAt: issued.expiresAt,
      invitationToken: issued.rawToken,
    });
  } catch (error) {
    console.error('[collectors] invitation delivery failed:', error);
  }

  return getCollector(userId);
}
