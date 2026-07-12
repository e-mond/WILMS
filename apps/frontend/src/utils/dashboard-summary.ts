import { DEMO_OPERATING_POOL_PESEWAS } from '@/constants/dashboard';
import { resolveDashboardCollectorName } from '@/constants/dashboard-demo-collectors';
import { BORROWER_STATUS, type BorrowerStatus } from '@/types/borrower';
import { DASHBOARD_ALERT_CATEGORY_META } from '@/constants/dashboard-alerts';
import type {
  DashboardAlert,
  DashboardBorrowerSegment,
  DashboardCollectorPerformanceRow,
  DashboardCycleMetric,
  DashboardGroupRiskInput,
  DashboardGroupRiskSegment,
  DashboardKpi,
  DashboardSummary,
  DashboardValueTone,
} from '@/types/dashboard';
import { LOAN_STATUS, type LoanPortfolioEntry } from '@/types/loan';
import { SCHEDULE_WEEK_STATUS, type LoanScheduleWeek } from '@/types/loan-schedule';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import { hasConsecutiveMissedWeeks } from '@/utils/defaulter-escalation';
import { resolveUserDisplayId } from '@/utils/entity-display-id';
import { countMissedWeeks } from '@/utils/schedule-missed-marking';

export interface DashboardBorrowerInput {
  id: string;
  status: BorrowerStatus;
}

function buildLoanCollectorMap(
  transactions: readonly FinancialTransaction[],
): Map<string, string> {
  const loanCollectorMap = new Map<string, string>();

  for (const transaction of transactions) {
    if (transaction.type === TRANSACTION_TYPE.DISBURSEMENT && transaction.loanId) {
      loanCollectorMap.set(transaction.loanId, transaction.collectorId);
    }
  }

  return loanCollectorMap;
}

function sumExpectedWeeklyForCollector(
  loans: LoanPortfolioEntry[],
  loanCollectorMap: Map<string, string>,
  collectorId: string,
): number {
  return loans
    .filter((loan) => loan.status === LOAN_STATUS.ACTIVE)
    .filter((loan) => loanCollectorMap.get(loan.id) === collectorId)
    .reduce((total, loan) => total + loan.weeklyPaymentPesewas, 0);
}

export interface DashboardSummaryOverrides {
  kpis?: DashboardKpi[];
  borrowerSegments?: DashboardBorrowerSegment[];
  collectorPerformance?: DashboardCollectorPerformanceRow[];
  cycleMetrics?: DashboardCycleMetric[];
  recentAlerts?: DashboardAlert[];
}

export interface BuildDashboardSummaryInput {
  borrowers: DashboardBorrowerInput[];
  loans: LoanPortfolioEntry[];
  transactions: readonly FinancialTransaction[];
  groupRisk: DashboardGroupRiskInput[];
  schedulesByLoanId: Record<string, LoanScheduleWeek[]>;
  referenceDate?: string;
  overrides?: DashboardSummaryOverrides;
}

function sumTransactionsByType(
  transactions: readonly FinancialTransaction[],
  type: (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE],
): number {
  return transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amountPesewas, 0);
}

function sumRepaymentsByCollector(
  transactions: readonly FinancialTransaction[],
  collectorId: string,
): number {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === TRANSACTION_TYPE.REPAYMENT &&
        transaction.collectorId === collectorId,
    )
    .reduce((total, transaction) => total + transaction.amountPesewas, 0);
}

function classifyBorrowerRepaymentStatus(
  borrower: DashboardBorrowerInput,
  loans: LoanPortfolioEntry[],
  schedulesByLoanId: Record<string, LoanScheduleWeek[]>,
): DashboardBorrowerSegment['tone'] | null {
  if (borrower.status === BORROWER_STATUS.PENDING) {
    return null;
  }

  if (borrower.status === BORROWER_STATUS.BLACKLISTED) {
    return 'blacklisted';
  }

  const activeLoan = loans.find(
    (loan) => loan.borrowerId === borrower.id && loan.status === LOAN_STATUS.ACTIVE,
  );

  if (!activeLoan) {
    return null;
  }

  const schedule = schedulesByLoanId[activeLoan.id] ?? [];

  if (hasConsecutiveMissedWeeks(schedule, 2)) {
    return 'defaulted';
  }

  if (countMissedWeeks(schedule) >= 1) {
    return 'atRisk';
  }

  return 'active';
}

export function buildBorrowerSegments(
  borrowers: DashboardBorrowerInput[],
  loans: LoanPortfolioEntry[],
  schedulesByLoanId: Record<string, LoanScheduleWeek[]>,
): DashboardBorrowerSegment[] {
  const counts = {
    active: 0,
    atRisk: 0,
    defaulted: 0,
    blacklisted: 0,
    pending: 0,
  };

  for (const borrower of borrowers) {
    if (borrower.status === BORROWER_STATUS.PENDING) {
      counts.pending += 1;
      continue;
    }

    const tone = classifyBorrowerRepaymentStatus(borrower, loans, schedulesByLoanId);

    if (tone) {
      counts[tone] += 1;
    }
  }

  return [
    { id: 'active', label: 'Active', count: counts.active, tone: 'active' },
    { id: 'atRisk', label: 'At Risk', count: counts.atRisk, tone: 'atRisk' },
    { id: 'defaulted', label: 'Defaulted', count: counts.defaulted, tone: 'defaulted' },
    {
      id: 'blacklisted',
      label: 'Blacklisted',
      count: counts.blacklisted,
      tone: 'blacklisted',
    },
    { id: 'pending', label: 'Pending', count: counts.pending, tone: 'pending' },
  ];
}

export function buildGroupRiskSegments(
  groupRisk: DashboardGroupRiskInput[],
): DashboardGroupRiskSegment[] {
  const total = groupRisk.length || 1;
  const grouped = {
    low: 0,
    atRisk: 0,
    flagged: 0,
    suspended: 0,
  };

  for (const group of groupRisk) {
    switch (group.riskLevel) {
      case 'LOW_RISK':
        grouped.low += 1;
        break;
      case 'AT_RISK':
        grouped.atRisk += 1;
        break;
      case 'FLAGGED':
        grouped.flagged += 1;
        break;
      case 'SUSPENDED':
        grouped.suspended += 1;
        break;
      default:
        break;
    }
  }

  return [
    {
      label: 'Low Risk',
      count: grouped.low,
      percent: Math.round((grouped.low / total) * 100),
      tone: 'low',
    },
    {
      label: 'At Risk',
      count: grouped.atRisk,
      percent: Math.round((grouped.atRisk / total) * 100),
      tone: 'atRisk',
    },
    {
      label: 'Flagged',
      count: grouped.flagged,
      percent: Math.round((grouped.flagged / total) * 100),
      tone: 'flagged',
    },
    {
      label: 'Suspended',
      count: grouped.suspended,
      percent: Math.round((grouped.suspended / total) * 100),
      tone: 'suspended',
    },
  ];
}

export function buildCollectorPerformanceRows(
  loans: LoanPortfolioEntry[],
  transactions: readonly FinancialTransaction[],
): DashboardCollectorPerformanceRow[] {
  const loanCollectorMap = buildLoanCollectorMap(transactions);
  const collectorIds = Array.from(
    new Set([
      ...transactions
        .filter((transaction) => transaction.type === TRANSACTION_TYPE.REPAYMENT)
        .map((transaction) => transaction.collectorId),
      ...loans
        .filter((loan) => loan.status === LOAN_STATUS.ACTIVE)
        .map((loan) => loanCollectorMap.get(loan.id))
        .filter((collectorId): collectorId is string => Boolean(collectorId)),
    ]),
  );

  if (!collectorIds.length) {
    return [];
  }

  return collectorIds.map((collectorId, index) => {
    const actualPesewas = sumRepaymentsByCollector(transactions, collectorId);
    const expectedPesewas = sumExpectedWeeklyForCollector(loans, loanCollectorMap, collectorId);
    const collectionRatePercent =
      expectedPesewas === 0 ? 0 : Math.round((actualPesewas / expectedPesewas) * 1000) / 10;
    const variancePesewas = actualPesewas - expectedPesewas;

    return {
      collectorId,
      collectorDisplayId: resolveUserDisplayId(collectorId, index + 1),
      name: resolveDashboardCollectorName(collectorId),
      expectedPesewas,
      actualPesewas,
      collectionRatePercent,
      variancePesewas,
    };
  });
}

function buildKpis(
  totalDisbursedPesewas: number,
  totalCollectedPesewas: number,
  totalOutstandingPesewas: number,
  repaymentRatePercent: number,
): DashboardKpi[] {
  const outstandingTrend: DashboardValueTone = 'danger';
  const collectedTrend: DashboardValueTone = 'success';

  return [
    {
      id: 'pool',
      label: 'Total Pool Funds',
      amountPesewas: DEMO_OPERATING_POOL_PESEWAS,
      trendLabel: '+12.4% vs last month',
      trendDirection: 'up',
      valueTone: 'gold',
    },
    {
      id: 'disbursed',
      label: 'Total Disbursed',
      amountPesewas: totalDisbursedPesewas,
      trendLabel: '+8.7% vs last month',
      trendDirection: 'up',
      valueTone: 'gold',
    },
    {
      id: 'collected',
      label: 'Total Collected',
      amountPesewas: totalCollectedPesewas,
      trendLabel: `Repayment rate ${repaymentRatePercent}%`,
      trendDirection: repaymentRatePercent >= 80 ? 'up' : 'neutral',
      valueTone: collectedTrend,
    },
    {
      id: 'outstanding',
      label: 'Total Outstanding',
      amountPesewas: totalOutstandingPesewas,
      trendLabel: totalOutstandingPesewas > 0 ? 'Monitor closely' : 'Fully current',
      trendDirection: totalOutstandingPesewas > 0 ? 'down' : 'up',
      valueTone: outstandingTrend,
    },
  ];
}

function resolveMissedAlertTimestamp(
  schedule: LoanScheduleWeek[],
  referenceDate: string,
): string {
  const missedWeeks = schedule.filter((week) => week.status === SCHEDULE_WEEK_STATUS.MISSED);
  const latestMissedDueDate = missedWeeks.at(-1)?.dueDate;

  if (latestMissedDueDate) {
    return `${latestMissedDueDate}T17:00:00.000Z`;
  }

  return `${referenceDate}T08:00:00.000Z`;
}

export function buildRecentAlerts(
  loans: LoanPortfolioEntry[],
  schedulesByLoanId: Record<string, LoanScheduleWeek[]>,
  referenceDate?: string,
): DashboardAlert[] {
  const resolvedReferenceDate = referenceDate ?? new Date().toISOString().slice(0, 10);
  const alerts: DashboardAlert[] = [];

  for (const loan of loans) {
    if (loan.status !== LOAN_STATUS.ACTIVE) {
      continue;
    }

    const schedule = schedulesByLoanId[loan.id] ?? [];
    const missedWeeks = countMissedWeeks(schedule);

    if (missedWeeks > 0) {
      const meta = DASHBOARD_ALERT_CATEGORY_META.MISSED_PAYMENT;

      alerts.push({
        id: `missed-${loan.id}`,
        severity: meta.defaultSeverity,
        category: meta.category,
        message: `Missed payment — ${loan.borrowerName} (${missedWeeks} week${missedWeeks === 1 ? '' : 's'})`,
        createdAt: resolveMissedAlertTimestamp(schedule, resolvedReferenceDate),
        icon: meta.icon,
        entityRef: loan.borrowerId,
        href: meta.defaultHref,
      });
    }
  }

  if (alerts.length < 3) {
    const meta = DASHBOARD_ALERT_CATEGORY_META.RECONCILIATION_VARIANCE;

    alerts.push({
      id: 'variance-collector',
      severity: meta.defaultSeverity,
      category: meta.category,
      message: 'Reconciliation variance — Field Collector (pending submission)',
      createdAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      icon: meta.icon,
      href: meta.defaultHref,
    });
  }

  const severityRank: Record<DashboardAlert['severity'], number> = {
    danger: 0,
    warning: 1,
    info: 2,
  };

  return alerts
    .sort((left, right) => {
      const rankDelta = severityRank[left.severity] - severityRank[right.severity];

      if (rankDelta !== 0) {
        return rankDelta;
      }

      return right.createdAt.localeCompare(left.createdAt);
    })
    .slice(0, 5);
}

export function buildDashboardSummary(input: BuildDashboardSummaryInput): DashboardSummary {
  const referenceDate = input.referenceDate ?? new Date().toISOString().slice(0, 10);
  const totalDisbursedPesewas = sumTransactionsByType(
    input.transactions,
    TRANSACTION_TYPE.DISBURSEMENT,
  );
  const totalCollectedPesewas = sumTransactionsByType(
    input.transactions,
    TRANSACTION_TYPE.REPAYMENT,
  );
  const totalOutstandingPesewas = input.loans
    .filter((loan) => loan.status === LOAN_STATUS.ACTIVE)
    .reduce((total, loan) => total + loan.outstandingPesewas, 0);
  const repaymentRatePercent =
    totalDisbursedPesewas === 0
      ? 0
      : Math.round((totalCollectedPesewas / totalDisbursedPesewas) * 1000) / 10;
  const pendingApplications = input.borrowers.filter(
    (borrower) => borrower.status === BORROWER_STATUS.PENDING,
  ).length;
  const activeLoans = input.loans.filter((loan) => loan.status === LOAN_STATUS.ACTIVE);
  const avgLoanPesewas =
    activeLoans.length === 0
      ? 0
      : Math.round(
          activeLoans.reduce((total, loan) => total + loan.amountPesewas, 0) / activeLoans.length,
        );
  const overdueCount = activeLoans.filter(
    (loan) => countMissedWeeks(input.schedulesByLoanId[loan.id] ?? []) > 0,
  ).length;

  const computedCycleMetrics: DashboardCycleMetric[] = [
    { label: 'Active Groups', value: String(input.groupRisk.length) },
    {
      label: 'New Loans (MTD)',
      value: String(
        input.loans.filter((loan) => loan.startDate.startsWith(referenceDate.slice(0, 7))).length,
      ),
    },
    {
      label: 'Avg Loan Size',
      value:
        avgLoanPesewas === 0
          ? '—'
          : new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(
              avgLoanPesewas / 100,
            ),
    },
    { label: 'Repayment Rate', value: `${repaymentRatePercent}%` },
    { label: 'Pending Applications', value: String(pendingApplications) },
    { label: 'Overdue > 30D', value: String(overdueCount) },
  ];

  return {
    generatedAt: new Date().toISOString(),
    kpis:
      input.overrides?.kpis ??
      buildKpis(
        totalDisbursedPesewas,
        totalCollectedPesewas,
        totalOutstandingPesewas,
        repaymentRatePercent,
      ),
    borrowerSegments:
      input.overrides?.borrowerSegments ??
      buildBorrowerSegments(input.borrowers, input.loans, input.schedulesByLoanId),
    collectorPerformance:
      input.overrides?.collectorPerformance ??
      buildCollectorPerformanceRows(input.loans, input.transactions),
    groupRisk: buildGroupRiskSegments(input.groupRisk),
    totalGroups: input.groupRisk.length,
    cycleMetrics: input.overrides?.cycleMetrics ?? computedCycleMetrics,
    recentAlerts:
      input.overrides?.recentAlerts ??
      buildRecentAlerts(input.loans, input.schedulesByLoanId, referenceDate),
    financialOverview: {
      capital: {
        totalCapitalAvailablePesewas: DEMO_OPERATING_POOL_PESEWAS,
        totalCapitalInjectedPesewas: DEMO_OPERATING_POOL_PESEWAS + totalDisbursedPesewas,
        currentAvailableBalancePesewas: Math.max(
          0,
          DEMO_OPERATING_POOL_PESEWAS - totalDisbursedPesewas,
        ),
      },
      lending: {
        totalLoanAmountDisbursedPesewas: totalDisbursedPesewas,
        totalActiveLoans: activeLoans.length,
        totalClosedLoans: input.loans.filter((loan) => loan.status === LOAN_STATUS.COMPLETED)
          .length,
      },
      collections: {
        totalAmountCollectedPesewas: totalCollectedPesewas,
        outstandingBalancePesewas: totalOutstandingPesewas,
        amountDueThisWeekPesewas: activeLoans.reduce(
          (total, loan) => total + loan.weeklyPaymentPesewas,
          0,
        ),
        overdueAmountPesewas: activeLoans
          .filter((loan) => countMissedWeeks(input.schedulesByLoanId[loan.id] ?? []) > 0)
          .reduce((total, loan) => total + loan.outstandingPesewas, 0),
        collectionRatePercent: Math.round(repaymentRatePercent),
      },
      adminFees: {
        totalAdminFeesExpectedPesewas: 0,
        totalAdminFeesCollectedPesewas: 0,
        outstandingAdminFeesPesewas: 0,
      },
      expenses: {
        totalExpensesPesewas: 0,
        operationalCostsPesewas: 0,
        cashOutflowPesewas: 0,
      },
      cashFlow: {
        moneyIn: {
          loanCollectionsPesewas: totalCollectedPesewas,
          adminFeesPesewas: 0,
          capitalDepositsPesewas: DEMO_OPERATING_POOL_PESEWAS,
          otherIncomePesewas: 0,
          totalPesewas: totalCollectedPesewas + DEMO_OPERATING_POOL_PESEWAS,
        },
        moneyOut: {
          loanDisbursementsPesewas: totalDisbursedPesewas,
          operationalExpensesPesewas: 0,
          refundsPesewas: 0,
          adjustmentsPesewas: 0,
          totalPesewas: totalDisbursedPesewas,
        },
        netPositionPesewas:
          totalCollectedPesewas + DEMO_OPERATING_POOL_PESEWAS - totalDisbursedPesewas,
      },
    },
  };
}
