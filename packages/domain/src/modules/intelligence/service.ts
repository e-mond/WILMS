import { uuidv7 } from 'uuidv7';
import { desc, eq, sql } from 'drizzle-orm';
import { isDatabaseEnabled, getDb } from '../../db/client.js';
import {
  alertThresholds,
  earlyWarningEvents,
  exportJobs,
  maintenanceWindows,
  operationalIncidents,
} from '../../db/schema/intelligence.js';
import { buildDashboardFinancialOverview } from '../dashboard/financial-overview.js';
import { getDashboardSummary } from '../dashboard/service.js';
import { buildAgingAnalysisReport, buildWriteOffReport } from '../enterprise/service.js';
import { buildOpsStatusReport } from '../ops/service.js';
import { getSchedulerLastRuns } from '../../infrastructure/scheduler/scheduler-run-state.js';
import { getNotificationMetrics } from '../../infrastructure/notifications/notification-metrics.js';
import { listAuditEntries } from '../../infrastructure/audit/audit-log.js';
import * as userRepo from '../../repositories/user.repository.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import { decimalToPesewas } from '../../domain/money.js';
import { listBorrowers, listPayments } from '../../db/persistence.js';
import { listGroupsResponse } from '../groups/service.js';
import { getExpenseSummary } from '../expenses/service.js';

const memoryExports: Array<Record<string, unknown>> = [];
const memoryThresholds: Array<Record<string, unknown>> = [
  {
    id: 'thr-collection-rate',
    key: 'collection_rate_min',
    label: 'Minimum collection rate',
    metric: 'collectionRatePercent',
    operator: 'lte',
    thresholdValue: 70,
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'thr-overdue',
    key: 'overdue_amount_max',
    label: 'Maximum overdue amount (GHS)',
    metric: 'overdueAmountGhs',
    operator: 'gte',
    thresholdValue: 5000,
    severity: 'danger',
    enabled: true,
  },
  {
    id: 'thr-expense-ratio',
    key: 'expense_ratio_max',
    label: 'Maximum expense ratio %',
    metric: 'expenseRatioPercent',
    operator: 'gte',
    thresholdValue: 25,
    severity: 'warning',
    enabled: true,
  },
];
const memoryWarnings: Array<Record<string, unknown>> = [];
const memoryIncidents: Array<Record<string, unknown>> = [];
const memoryMaintenance: Array<Record<string, unknown>> = [];

function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function buildExecutiveDashboard(input?: {
  district?: string;
  community?: string;
  asOfDate?: string;
}) {
  const [summary, writeOffs, aging, ops, expenses] = await Promise.all([
    getDashboardSummary(),
    buildWriteOffReport(),
    buildAgingAnalysisReport(),
    buildOpsStatusReport(),
    getExpenseSummary(),
  ]);

  const overview = summary.financialOverview;
  const totalPortfolio =
    overview.lending.totalLoanAmountDisbursedPesewas;
  const outstanding = overview.collections.outstandingBalancePesewas;
  const collected = overview.collections.totalAmountCollectedPesewas;
  const writeOffPesewas = writeOffs.summary.totalWrittenOffPesewas;
  const recoveryRate =
    totalPortfolio > 0 ? Math.round((collected / totalPortfolio) * 1000) / 10 : 0;
  const expenseRatio =
    collected > 0
      ? Math.round((overview.expenses.totalExpensesPesewas / collected) * 1000) / 10
      : 0;

  const par30 = aging.summary.days1to7 + aging.summary.days8to30;
  const par60 = aging.summary.days8to30;
  const par90 = aging.summary.days31plus;
  const activeLoans = aging.summary.current + par30 + par90;
  const par30Rate = activeLoans > 0 ? Math.round((par30 / activeLoans) * 1000) / 10 : 0;
  const par60Rate = activeLoans > 0 ? Math.round((par60 / activeLoans) * 1000) / 10 : 0;
  const par90Rate = activeLoans > 0 ? Math.round((par90 / activeLoans) * 1000) / 10 : 0;

  const pools = overview.capital;
  const poolUtilization =
    pools.totalCapitalInjectedPesewas > 0
      ? Math.round(
          ((pools.totalCapitalInjectedPesewas - pools.currentAvailableBalancePesewas) /
            pools.totalCapitalInjectedPesewas) *
            1000,
        ) / 10
      : 0;

  const scheduler = getSchedulerLastRuns();
  const notif = getNotificationMetrics();

  return {
    generatedAt: new Date().toISOString(),
    asOfDate: input?.asOfDate ?? new Date().toISOString().slice(0, 10),
    filters: {
      district: input?.district ?? null,
      community: input?.community ?? null,
    },
    financial: {
      totalPortfolioPesewas: totalPortfolio,
      activePortfolioPesewas: outstanding,
      disbursedPesewas: overview.lending.totalLoanAmountDisbursedPesewas,
      collectedPesewas: collected,
      outstandingPesewas: outstanding,
      writeOffsPesewas: writeOffPesewas,
      recoveryRatePercent: recoveryRate,
      operatingCashPesewas: overview.cashFlow.netOperatingCashPesewas,
      expenseRatioPercent: expenseRatio,
      poolUtilizationPercent: poolUtilization,
      liquidityPesewas: pools.currentAvailableBalancePesewas,
      totalExpensesPesewas: overview.expenses.totalExpensesPesewas,
      collectionRatePercent: overview.collections.collectionRatePercent,
    },
    operational: {
      activeGroups: summary.totalGroups,
      activeBorrowers: summary.borrowerSegments.find((s) => s.id === 'active')?.count ?? 0,
      activeLoans: overview.lending.totalActiveLoans,
      closedLoans: overview.lending.totalClosedLoans,
      collectorPerformance: summary.collectorPerformance.slice(0, 10),
      reconciliationAlerts: summary.recentAlerts.filter((a) =>
        /reconcil/i.test(a.category + a.message),
      ).length,
      notificationSent: notif.sent,
      notificationFailed: notif.failed,
      schedulerPaymentOk: scheduler.paymentNotifications?.success ?? null,
      schedulerCommsOk: scheduler.communications?.success ?? null,
      approvalQueueHint: summary.recentAlerts.filter((a) => /approv/i.test(a.message)).length,
    },
    risk: {
      par30Count: par30,
      par60Count: par60,
      par90Count: par90,
      par30RatePercent: par30Rate,
      par60RatePercent: par60Rate,
      par90RatePercent: par90Rate,
      delinquencyBuckets: aging.summary,
      writeOffTrend: {
        approved: writeOffs.summary.approvedCount,
        pending: writeOffs.summary.pendingCount,
        totalPesewas: writeOffPesewas,
      },
      highRiskGroups: summary.groupRisk.filter((g) => g.tone !== 'low'),
      recentAlerts: summary.recentAlerts.slice(0, 8),
    },
    opsHealth: {
      databaseEnabled: ops.databaseEnabled,
      healthStatus: ops.health.status,
      backupStatus: ops.backups.status,
      surfacesDegraded: ops.surfaces.filter((s) => s.state === 'degraded' || s.state === 'unavailable')
        .length,
    },
    expensePeriods: {
      todayPesewas: expenses.todayPesewas,
      weekPesewas: expenses.weekPesewas,
      monthPesewas: expenses.monthPesewas,
      yearPesewas: expenses.yearPesewas,
    },
  };
}

export async function buildForecastSnapshot(horizonDays = 28) {
  const overview = await buildDashboardFinancialOverview();
  const today = new Date().toISOString().slice(0, 10);
  const weeklyDue = overview.collections.amountDueThisWeekPesewas;
  const weeks = Math.max(1, Math.ceil(horizonDays / 7));
  const collectionRate = Math.max(0.4, Math.min(1, overview.collections.collectionRatePercent / 100));

  const expectedCollectionsPesewas = Math.round(weeklyDue * weeks);
  const projectedCollectionsPesewas = Math.round(expectedCollectionsPesewas * collectionRate);
  const projectedExpensesPesewas = Math.round(
    (overview.expenses.totalExpensesPesewas / 4) * weeks,
  );
  const projectedCashFlowPesewas = projectedCollectionsPesewas - projectedExpensesPesewas;
  const liquidityForecastPesewas =
    overview.capital.currentAvailableBalancePesewas + projectedCashFlowPesewas;

  let delinquencyPressure = 0;
  if (isDatabaseEnabled()) {
    const aging = await buildAgingAnalysisReport();
    delinquencyPressure =
      aging.summary.days1to7 * 1 + aging.summary.days8to30 * 2 + aging.summary.days31plus * 3;
  }

  const series = Array.from({ length: weeks }, (_, index) => {
    const weekStart = addDaysIso(today, index * 7);
    return {
      weekStarting: weekStart,
      expectedPesewas: weeklyDue,
      projectedPesewas: Math.round(weeklyDue * collectionRate),
      expensePesewas: Math.round(projectedExpensesPesewas / weeks),
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    horizonDays,
    assumptions: {
      method: 'schedule-based weekly due × observed collection rate',
      collectionRatePercent: overview.collections.collectionRatePercent,
      weeklyDuePesewas: weeklyDue,
    },
    summary: {
      expectedCollectionsPesewas,
      projectedCollectionsPesewas,
      projectedCashFlowPesewas,
      liquidityForecastPesewas,
      poolUtilizationForecastPercent:
        overview.capital.totalCapitalInjectedPesewas > 0
          ? Math.round(
              ((overview.capital.totalCapitalInjectedPesewas -
                Math.max(0, liquidityForecastPesewas)) /
                overview.capital.totalCapitalInjectedPesewas) *
                1000,
            ) / 10
          : 0,
      delinquencyPressureIndex: delinquencyPressure,
      projectedExpensesPesewas,
    },
    series,
  };
}

export async function evaluateEarlyWarnings(actorUserId?: string) {
  const overview = await buildDashboardFinancialOverview();
  const metrics: Record<string, number> = {
    collectionRatePercent: overview.collections.collectionRatePercent,
    overdueAmountGhs: overview.collections.overdueAmountPesewas / 100,
    expenseRatioPercent:
      overview.collections.totalAmountCollectedPesewas > 0
        ? (overview.expenses.totalExpensesPesewas /
            overview.collections.totalAmountCollectedPesewas) *
          100
        : 0,
  };

  const thresholds = await listAlertThresholds();
  const triggered: Array<Record<string, unknown>> = [];

  for (const threshold of thresholds) {
    if (!threshold.enabled) continue;
    const value = metrics[String(threshold.metric)] ?? 0;
    const limit = Number(threshold.thresholdValue);
    const hit =
      threshold.operator === 'lte' ? value <= limit : threshold.operator === 'lt' ? value < limit : value >= limit;
    if (!hit) continue;

    const event = {
      id: uuidv7(),
      thresholdKey: String(threshold.key),
      severity: String(threshold.severity),
      title: String(threshold.label),
      message: `${threshold.label}: observed ${value.toFixed(1)} (threshold ${limit}).`,
      metricValue: value,
      createdAt: new Date().toISOString(),
    };
    triggered.push(event);

    if (isDatabaseEnabled()) {
      const db = getDb();
      await db.insert(earlyWarningEvents).values({
        id: event.id,
        thresholdKey: event.thresholdKey,
        severity: event.severity,
        title: event.title,
        message: event.message,
        metricValue: event.metricValue,
      });
    } else {
      memoryWarnings.unshift(event);
      memoryWarnings.splice(100);
    }
  }

  void actorUserId;
  return { generatedAt: new Date().toISOString(), metrics, triggered };
}

export async function listAlertThresholds() {
  if (!isDatabaseEnabled()) {
    return memoryThresholds;
  }
  const db = getDb();
  const rows = await db.select().from(alertThresholds);
  if (rows.length === 0) {
    for (const seed of memoryThresholds) {
      await db.insert(alertThresholds).values({
        id: uuidv7(),
        key: String(seed.key),
        label: String(seed.label),
        metric: String(seed.metric),
        operator: String(seed.operator),
        thresholdValue: Number(seed.thresholdValue),
        severity: String(seed.severity),
        enabled: true,
      });
    }
    return db.select().from(alertThresholds);
  }
  return rows;
}

export async function upsertAlertThreshold(input: {
  key: string;
  label: string;
  metric: string;
  operator?: string;
  thresholdValue: number;
  severity?: string;
  enabled?: boolean;
  actorUserId: string;
}) {
  const record = {
    id: uuidv7(),
    key: input.key,
    label: input.label,
    metric: input.metric,
    operator: input.operator ?? 'gte',
    thresholdValue: input.thresholdValue,
    severity: input.severity ?? 'warning',
    enabled: input.enabled ?? true,
    updatedByUserId: input.actorUserId,
  };

  if (!isDatabaseEnabled()) {
    const index = memoryThresholds.findIndex((entry) => entry.key === input.key);
    if (index >= 0) {
      memoryThresholds[index] = { ...memoryThresholds[index], ...record, id: memoryThresholds[index]!.id };
      return memoryThresholds[index];
    }
    memoryThresholds.push(record);
    return record;
  }

  const db = getDb();
  const existing = await db.select().from(alertThresholds).where(eq(alertThresholds.key, input.key));
  if (existing[0]) {
    await db
      .update(alertThresholds)
      .set({
        label: record.label,
        metric: record.metric,
        operator: record.operator,
        thresholdValue: record.thresholdValue,
        severity: record.severity,
        enabled: record.enabled,
        updatedByUserId: input.actorUserId,
        updatedAt: new Date(),
      })
      .where(eq(alertThresholds.key, input.key));
    return { ...existing[0], ...record, id: existing[0].id };
  }

  await db.insert(alertThresholds).values(record);
  return record;
}

export async function listEarlyWarnings(limit = 50) {
  if (!isDatabaseEnabled()) {
    return memoryWarnings.slice(0, limit);
  }
  const db = getDb();
  return db.select().from(earlyWarningEvents).orderBy(desc(earlyWarningEvents.createdAt)).limit(limit);
}

export async function buildCompliancePack() {
  const users = isDatabaseEnabled() ? await userRepo.listUsers() : [];
  const inactive = users.filter((user) => user.status === 'SUSPENDED');
  const invited = users.filter((user) => user.status === 'INVITED');
  const audit = (await listAuditEntries({ limit: 200 })).slice(0, 200);

  const overrideCount = isDatabaseEnabled()
    ? await (async () => {
        try {
          const db = getDb();
          const result = await db.execute(sql`SELECT COUNT(*)::int AS total FROM user_permission_overrides`);
          return Number((result.rows[0] as { total?: number } | undefined)?.total ?? 0);
        } catch {
          return 0;
        }
      })()
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    userAccess: {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.status === 'ACTIVE').length,
      invitedUsers: invited.length,
      inactiveUsers: inactive.length,
      inactive: inactive.map((user) => ({
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      })),
    },
    permissionOverrides: {
      totalOverrides: overrideCount,
    },
    makerChecker: {
      note: 'Financial adjustments, expenses, and reconciliations require a second actor for approve/reject.',
      recentAuditActions: audit
        .filter((entry) => /approv|reject|adjust|reconcil|expense/i.test(entry.action))
        .slice(0, 40),
    },
    financialIntegrity: {
      note: 'Ledger posts and pool allocations remain transactional; write-offs flow through adjustments.',
    },
  };
}

export async function createExportJob(input: {
  entityType: string;
  format: 'CSV' | 'EXCEL' | 'PDF';
  actorUserId: string;
  filters?: Record<string, unknown>;
}) {
  const allowed = new Set([
    'borrowers',
    'groups',
    'collectors',
    'loans',
    'payments',
    'reconciliations',
    'expenses',
    'reports',
    'notifications',
    'communications',
    'audit',
  ]);
  if (!allowed.has(input.entityType)) {
    throw new Error('VALIDATION:Unsupported export entity type.');
  }

  const job = {
    id: uuidv7(),
    entityType: input.entityType,
    format: input.format,
    status: 'COMPLETED',
    requestedByUserId: input.actorUserId,
    filters: input.filters ?? null,
    rowCount: 0,
    fileName: `${input.entityType}-${new Date().toISOString().slice(0, 10)}.${input.format.toLowerCase()}`,
    errorMessage: null as string | null,
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    previewRows: [] as Array<Record<string, unknown>>,
  };

  try {
    const preview = await buildExportPreview(input.entityType);
    job.rowCount = preview.length;
    job.previewRows = preview.slice(0, 100);
  } catch (error) {
    job.status = 'FAILED';
    job.errorMessage = error instanceof Error ? error.message : 'Export failed';
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(exportJobs).values({
      id: job.id,
      entityType: job.entityType,
      format: job.format,
      status: job.status,
      requestedByUserId: job.requestedByUserId,
      filters: job.filters,
      rowCount: job.rowCount,
      fileName: job.fileName,
      errorMessage: job.errorMessage,
      expiresAt: new Date(job.expiresAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : null,
    });
  } else {
    memoryExports.unshift(job);
    memoryExports.splice(100);
  }

  return job;
}

async function buildExportPreview(entityType: string): Promise<Array<Record<string, unknown>>> {
  switch (entityType) {
    case 'borrowers': {
      const borrowers = await listBorrowers();
      return borrowers.slice(0, 500).map((entry) => ({
        id: entry.id,
        fullName: entry.fullName,
        phone: entry.phone,
        community: entry.community,
        status: entry.status,
      }));
    }
    case 'groups': {
      const groups = await listGroupsResponse();
      return groups.groups.map((entry) => ({
        id: entry.id,
        name: entry.name,
        community: entry.community,
        members: entry.memberCount,
        collectionRatePercent: entry.collectionRatePercent,
      }));
    }
    case 'loans': {
      if (!isDatabaseEnabled()) return [];
      const loans = await loanRepo.listLoans();
      return loans.slice(0, 500).map((loan) => ({
        id: loan.id,
        borrowerId: loan.borrowerId,
        status: loan.externalStatus,
        balancePesewas: decimalToPesewas(loan.loanBalance),
      }));
    }
    case 'payments': {
      const payments = await listPayments();
      return payments.slice(0, 500).map((payment) => ({
        id: payment.id,
        borrowerId: payment.borrowerId,
        amountPesewas: payment.amountPesewas,
        paymentDate: payment.paymentDate,
        recordedAt: payment.recordedAt,
      }));
    }
    case 'audit': {
      const entries = await listAuditEntries({ limit: 500 });
      return entries.map((entry) => ({
        id: entry.id,
        action: entry.action,
        actorId: entry.actorId,
        targetEntityId: entry.targetEntityId,
        createdAt: entry.createdAt,
      }));
    }
    default:
      return [];
  }
}

export async function listExportJobs(limit = 50) {
  if (!isDatabaseEnabled()) {
    return memoryExports.slice(0, limit);
  }
  const db = getDb();
  return db.select().from(exportJobs).orderBy(desc(exportJobs.createdAt)).limit(limit);
}

export async function createIncident(input: {
  title: string;
  severity?: string;
  summary?: string;
  actorUserId: string;
  ownerUserId?: string;
}) {
  const incident = {
    id: uuidv7(),
    title: input.title.trim(),
    severity: input.severity ?? 'warning',
    status: 'OPEN',
    ownerUserId: input.ownerUserId ?? null,
    summary: input.summary ?? null,
    resolution: null as string | null,
    openedAt: new Date().toISOString(),
    createdByUserId: input.actorUserId,
    updatedAt: new Date().toISOString(),
  };
  if (!incident.title) {
    throw new Error('VALIDATION:Incident title is required.');
  }

  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(operationalIncidents).values({
      id: incident.id,
      title: incident.title,
      severity: incident.severity,
      status: incident.status,
      ownerUserId: incident.ownerUserId,
      summary: incident.summary,
      createdByUserId: incident.createdByUserId,
    });
  } else {
    memoryIncidents.unshift(incident);
  }
  return incident;
}

export async function listIncidents(limit = 50) {
  if (!isDatabaseEnabled()) {
    return memoryIncidents.slice(0, limit);
  }
  const db = getDb();
  return db
    .select()
    .from(operationalIncidents)
    .orderBy(desc(operationalIncidents.openedAt))
    .limit(limit);
}

export async function acknowledgeIncident(id: string, actorUserId: string) {
  if (!isDatabaseEnabled()) {
    const incident = memoryIncidents.find((entry) => entry.id === id);
    if (!incident) throw new Error('NOT_FOUND');
    incident.status = 'ACKNOWLEDGED';
    incident.acknowledgedAt = new Date().toISOString();
    return incident;
  }
  const db = getDb();
  await db
    .update(operationalIncidents)
    .set({
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(operationalIncidents.id, id));
  const [row] = await db.select().from(operationalIncidents).where(eq(operationalIncidents.id, id));
  if (!row) throw new Error('NOT_FOUND');
  void actorUserId;
  return row;
}

export async function resolveIncident(id: string, resolution: string, actorUserId: string) {
  if (!isDatabaseEnabled()) {
    const incident = memoryIncidents.find((entry) => entry.id === id);
    if (!incident) throw new Error('NOT_FOUND');
    incident.status = 'RESOLVED';
    incident.resolution = resolution;
    incident.resolvedAt = new Date().toISOString();
    return incident;
  }
  const db = getDb();
  await db
    .update(operationalIncidents)
    .set({
      status: 'RESOLVED',
      resolution,
      resolvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(operationalIncidents.id, id));
  const [row] = await db.select().from(operationalIncidents).where(eq(operationalIncidents.id, id));
  if (!row) throw new Error('NOT_FOUND');
  void actorUserId;
  return row;
}

export async function listMaintenanceWindows() {
  if (!isDatabaseEnabled()) {
    return memoryMaintenance;
  }
  const db = getDb();
  return db.select().from(maintenanceWindows).orderBy(desc(maintenanceWindows.startsAt));
}

export async function createMaintenanceWindow(input: {
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
  actorUserId: string;
}) {
  const record = {
    id: uuidv7(),
    title: input.title.trim(),
    message: input.message.trim(),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    active: true,
    createdByUserId: input.actorUserId,
    createdAt: new Date().toISOString(),
  };
  if (!record.title || !record.message) {
    throw new Error('VALIDATION:Title and message are required.');
  }
  if (isDatabaseEnabled()) {
    const db = getDb();
    await db.insert(maintenanceWindows).values({
      id: record.id,
      title: record.title,
      message: record.message,
      startsAt: new Date(record.startsAt),
      endsAt: new Date(record.endsAt),
      active: true,
      createdByUserId: record.createdByUserId,
    });
  } else {
    memoryMaintenance.unshift(record);
  }
  return record;
}

export async function buildPortfolioBreakdown() {
  const [groups, overview, aging] = await Promise.all([
    listGroupsResponse(),
    buildDashboardFinancialOverview(),
    buildAgingAnalysisReport(),
  ]);

  const byCommunity = new Map<string, { community: string; groups: number; members: number; collectionRate: number }>();
  for (const group of groups.groups) {
    const current = byCommunity.get(group.community) ?? {
      community: group.community,
      groups: 0,
      members: 0,
      collectionRate: 0,
    };
    current.groups += 1;
    current.members += group.memberCount;
    current.collectionRate += group.collectionRatePercent;
    byCommunity.set(group.community, current);
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      disbursedPesewas: overview.lending.totalLoanAmountDisbursedPesewas,
      outstandingPesewas: overview.collections.outstandingBalancePesewas,
      collectedPesewas: overview.collections.totalAmountCollectedPesewas,
      activeLoans: overview.lending.totalActiveLoans,
    },
    byCommunity: Array.from(byCommunity.values()).map((entry) => ({
      ...entry,
      avgCollectionRatePercent:
        entry.groups > 0 ? Math.round((entry.collectionRate / entry.groups) * 10) / 10 : 0,
    })),
    byStatus: aging.summary,
    byGroupRisk: groups.riskDistribution,
  };
}

/** Keep schedule repo import available for future cashflow schedule scans. */
void scheduleRepo;
