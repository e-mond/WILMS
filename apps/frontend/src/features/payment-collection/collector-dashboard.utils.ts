import {
  COLLECTOR_PAYMENT_STATUS,
  RECONCILIATION_STATUS,
  type CollectorDashboard,
  type CollectorDashboardAlert,
  type CollectorDashboardBorrower,
  type CollectorDashboardHero,
  type CollectorDashboardStats,
  type CollectorMissedAlert,
  type CollectorPaymentStatus,
  type CollectorRecentPayment,
  type ReconciliationStatus,
} from '@/types/collector-dashboard';
import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { getWeekdayNameFromIsoDate, isLoanDueOnDate } from '@/utils/weekday';

export { getWeekdayNameFromIsoDate, isLoanDueOnDate };

export interface CollectorDashboardLoanInput {
  id: string;
  borrowerId: string;
  borrowerName: string;
  phone: string;
  community: string;
  groupName: string;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  missedWeeks: number;
}

export interface CollectorDashboardPaymentInput {
  borrowerId: string;
  amountPesewas: number;
  collectorId: string;
  paymentDate: string;
  recordedAt?: string;
}

export interface BuildCollectorDashboardInput {
  referenceDate: string;
  collectorId: string;
  loans: CollectorDashboardLoanInput[];
  payments: CollectorDashboardPaymentInput[];
  reconciliation: {
    expectedPesewas: number;
    actualPesewas: number;
    variancePesewas: number;
    submitted: boolean;
  };
}

export interface CollectorDashboardCore {
  summary: CollectorDashboard['summary'];
  borrowers: CollectorDashboardBorrower[];
  missedAlerts: CollectorMissedAlert[];
}

export function sumPaymentsForBorrowerOnDate(
  payments: CollectorDashboardPaymentInput[],
  collectorId: string,
  borrowerId: string,
  paymentDate: string,
): number {
  return payments
    .filter(
      (payment) =>
        payment.collectorId === collectorId &&
        payment.borrowerId === borrowerId &&
        payment.paymentDate === paymentDate,
    )
    .reduce((total, payment) => total + payment.amountPesewas, 0);
}

function resolveReconciliationStatus(
  reconciliation: BuildCollectorDashboardInput['reconciliation'],
): ReconciliationStatus {
  if (!reconciliation.submitted) {
    return RECONCILIATION_STATUS.PENDING;
  }

  if (reconciliation.variancePesewas !== 0) {
    return RECONCILIATION_STATUS.VARIANCE;
  }

  return RECONCILIATION_STATUS.COMPLETE;
}

function buildBorrowerRow(
  loan: CollectorDashboardLoanInput,
  input: BuildCollectorDashboardInput,
): CollectorDashboardBorrower {
  const collectedPesewas = sumPaymentsForBorrowerOnDate(
    input.payments,
    input.collectorId,
    loan.borrowerId,
    input.referenceDate,
  );

  let paymentStatus: CollectorPaymentStatus = COLLECTOR_PAYMENT_STATUS.PENDING;

  if (collectedPesewas >= loan.weeklyPaymentPesewas) {
    paymentStatus = COLLECTOR_PAYMENT_STATUS.COLLECTED;
  } else if (loan.missedWeeks > 0) {
    paymentStatus = COLLECTOR_PAYMENT_STATUS.MISSED;
  }

  return {
    borrowerId: loan.borrowerId,
    borrowerName: loan.borrowerName,
    borrowerPhotoUrl: resolvePersonPhotoUrl({ name: loan.borrowerName, id: loan.borrowerId }),
    phone: loan.phone,
    community: loan.community,
    groupName: loan.groupName,
    loanId: loan.id,
    expectedPesewas: loan.weeklyPaymentPesewas,
    collectedPesewas,
    paymentStatus,
  };
}

export function buildAllCollectorBorrowerRows(
  input: BuildCollectorDashboardInput,
): CollectorDashboardBorrower[] {
  return input.loans.map((loan) => buildBorrowerRow(loan, input));
}

export function buildCollectorDashboardCore(input: BuildCollectorDashboardInput): CollectorDashboardCore {
  const dueLoans = input.loans.filter((loan) =>
    isLoanDueOnDate(loan.paymentDay, input.referenceDate),
  );

  const borrowers = dueLoans.map((loan) => buildBorrowerRow(loan, input));
  const expectedPesewas = borrowers.reduce((total, row) => total + row.expectedPesewas, 0);
  const collectedPesewas = borrowers.reduce((total, row) => total + row.collectedPesewas, 0);
  const collectionRatePercent =
    expectedPesewas === 0 ? 0 : Math.round((collectedPesewas / expectedPesewas) * 100);

  const missedAlerts: CollectorMissedAlert[] = input.loans
    .filter((loan) => loan.missedWeeks > 0)
    .map((loan) => ({
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      loanId: loan.id,
      missedWeeks: loan.missedWeeks,
    }));

  const paidTodayCount = borrowers.filter(
    (row) => row.paymentStatus === COLLECTOR_PAYMENT_STATUS.COLLECTED,
  ).length;
  const missedTodayCount = borrowers.filter(
    (row) => row.paymentStatus === COLLECTOR_PAYMENT_STATUS.MISSED,
  ).length;
  const pendingTodayCount = borrowers.filter(
    (row) => row.paymentStatus === COLLECTOR_PAYMENT_STATUS.PENDING,
  ).length;

  return {
    summary: {
      date: input.referenceDate,
      paymentDayLabel: getWeekdayNameFromIsoDate(input.referenceDate),
      borrowersDueCount: borrowers.length,
      expectedPesewas,
      collectedPesewas,
      outstandingPesewas: Math.max(expectedPesewas - collectedPesewas, 0),
      paidTodayCount,
      missedTodayCount,
      pendingTodayCount,
      collectionRatePercent,
      missedAlertsCount: missedAlerts.length,
      reconciliationStatus: resolveReconciliationStatus(input.reconciliation),
      reconciliationVariancePesewas: input.reconciliation.variancePesewas,
    },
    borrowers,
    missedAlerts,
  };
}

/** @deprecated Use assembleCollectorDashboard from services/mock instead. */
export function buildCollectorDashboard(input: BuildCollectorDashboardInput): CollectorDashboard {
  const core = buildCollectorDashboardCore(input);

  return {
    ...core,
    hero: buildHeroFromSummary(core.summary),
    alerts: buildAlertsFromMissed(core.missedAlerts),
    todayGroups: [],
    recentPayments: buildRecentPaymentsFromBorrowers(core.borrowers, input),
    stats: buildStatsFromSummary(core.summary, input.loans.length, 0),
  };
}

export function buildHeroFromSummary(summary: CollectorDashboardCore['summary']): CollectorDashboardHero {
  return {
    targetPesewas: summary.expectedPesewas,
    progressPercent: summary.collectionRatePercent,
    groupsToday: 0,
    paidBorrowers: summary.paidTodayCount,
    pendingBorrowers: summary.pendingTodayCount,
    overdueBorrowers: summary.missedTodayCount,
    streakDays: 0,
    weeklyTrendPercent: 0,
  };
}

export function buildStatsFromSummary(
  summary: CollectorDashboardCore['summary'],
  borrowersManaged: number,
  groupsAssigned: number,
): CollectorDashboardStats {
  return {
    paymentsRecorded: summary.paidTodayCount,
    collectionRatePercent: summary.collectionRatePercent,
    borrowersManaged,
    groupsAssigned,
  };
}

export function buildAlertsFromMissed(missedAlerts: CollectorMissedAlert[]): CollectorDashboardAlert[] {
  if (missedAlerts.length === 0) {
    return [];
  }

  return [
    {
      id: 'missed-payments',
      message: `${missedAlerts.length} missed payment alert(s) today`,
      tone: 'error',
    },
  ];
}

export function buildRecentPaymentsFromBorrowers(
  borrowers: CollectorDashboardBorrower[],
  input: BuildCollectorDashboardInput,
): CollectorRecentPayment[] {
  return borrowers
    .filter((row) => row.collectedPesewas > 0)
    .slice(0, 8)
    .map((row) => {
      const payment = input.payments.find(
        (entry) =>
          entry.borrowerId === row.borrowerId &&
          entry.collectorId === input.collectorId &&
          entry.paymentDate === input.referenceDate,
      );

      return {
        borrowerId: row.borrowerId,
        borrowerName: row.borrowerName,
        borrowerPhotoUrl:
          row.borrowerPhotoUrl ??
          resolvePersonPhotoUrl({ name: row.borrowerName, id: row.borrowerId }),
        groupName: row.groupName,
        amountPesewas: row.collectedPesewas,
        recordedAt: payment?.recordedAt ?? `${input.referenceDate}T12:00:00.000Z`,
        status: row.paymentStatus,
      };
    });
}
