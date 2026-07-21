import { listBorrowers, listPayments } from '../../db/persistence.js';
import * as groupService from '../groups/service.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { decimalToPesewas } from '../../domain/money.js';
import { isLoanDueOnDate } from '../../domain/reconciliation/weekday.js';

export interface CollectorDashboardSummary {
  date: string;
  paymentDayLabel: string;
  borrowersDueCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  paidTodayCount: number;
  pendingTodayCount: number;
  missedTodayCount: number;
  collectionRatePercent: number;
  missedAlertsCount: number;
  reconciliationStatus: 'PENDING' | 'COMPLETE' | 'VARIANCE';
  reconciliationVariancePesewas: number;
}

export interface CollectorDashboard {
  summary: CollectorDashboardSummary;
  hero: {
    targetPesewas: number;
    progressPercent: number;
    groupsToday: number;
    paidBorrowers: number;
    pendingBorrowers: number;
    overdueBorrowers: number;
    streakDays: number;
    weeklyTrendPercent: number;
  };
  alerts: Array<{ id: string; message: string; tone: 'warning' | 'error' | 'info' }>;
  todayGroups: Array<{
    groupId: string;
    groupName: string;
    community: string;
    leaderName: string;
    groupPhotoUrl: string;
    collectedCount: number;
    expectedCount: number;
    pendingCount: number;
    expectedPesewas: number;
    amountCollectedPesewas: number;
    progressPercent: number;
    status: string;
  }>;
  recentPayments: Array<{
    borrowerId: string;
    borrowerName: string;
    borrowerPhotoUrl: string;
    groupName: string;
    amountPesewas: number;
    recordedAt: string;
    status: 'COLLECTED' | 'PENDING' | 'MISSED';
  }>;
  stats: {
    paymentsRecorded: number;
    collectionRatePercent: number;
    borrowersManaged: number;
    groupsAssigned: number;
  };
  borrowers: Array<{
    borrowerId: string;
    borrowerName: string;
    borrowerPhotoUrl?: string;
    phone: string;
    community: string;
    groupName: string;
    loanId: string;
    expectedPesewas: number;
    collectedPesewas: number;
    paymentStatus: 'COLLECTED' | 'PENDING' | 'MISSED';
  }>;
  missedAlerts: Array<{
    borrowerId: string;
    borrowerName: string;
    loanId: string;
    missedWeeks: number;
  }>;
}

function resolveReferenceDate(date?: string): string {
  return date ?? new Date().toISOString().slice(0, 10);
}

export async function getCollectorDashboard(
  collectorId: string,
  date?: string,
): Promise<CollectorDashboard> {
  const referenceDate = resolveReferenceDate(date);
  const useDb = isDatabaseEnabled();
  const [borrowers, payments, assignedGroups] = await Promise.all([
    listBorrowers(),
    useDb
      ? paymentRepo.listPaymentsForDate(referenceDate, { collectorId })
      : listPayments(),
    groupService.getGroupsForCollector(collectorId),
  ]);

  const borrowerIds = assignedGroups.flatMap((group) => group.memberIds);
  const scopedBorrowers =
    borrowerIds.length > 0
      ? borrowers.filter((borrower) => borrowerIds.includes(borrower.id))
      : borrowers;

  const collectorPayments = useDb
    ? payments
    : payments.filter(
        (payment) =>
          payment.collectorId === collectorId && payment.paymentDate === referenceDate,
      );
  const collectedPesewas = useDb
    ? await paymentRepo.sumConfirmedPaymentsForDatePesewas(referenceDate, { collectorId })
    : collectorPayments.reduce((sum, payment) => sum + payment.amountPesewas, 0);

  let expectedPesewas = 0;
  const borrowerRows: CollectorDashboard['borrowers'] = [];

  if (isDatabaseEnabled()) {
    const activeLoans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
    for (const borrower of scopedBorrowers) {
      const loan = activeLoans.find((entry) => entry.borrowerId === borrower.id);
      const weeklyExpected =
        loan && isLoanDueOnDate(loan.paymentDay, referenceDate)
          ? decimalToPesewas(loan.installmentAmount)
          : 0;
      expectedPesewas += weeklyExpected;
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      const paymentStatus =
        weeklyExpected > 0 && collectedForBorrower >= weeklyExpected
          ? 'COLLECTED'
          : collectedForBorrower > 0
            ? 'PENDING'
            : weeklyExpected > 0
              ? 'PENDING'
              : 'PENDING';

      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupName: borrower.groupName || '—',
        loanId: loan?.id ?? '',
        expectedPesewas: weeklyExpected,
        collectedPesewas: collectedForBorrower,
        paymentStatus,
      });
    }
  } else {
    for (const borrower of scopedBorrowers) {
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupName: borrower.groupName || '—',
        loanId: '',
        expectedPesewas: 0,
        collectedPesewas: collectedForBorrower,
        paymentStatus: collectedForBorrower > 0 ? 'COLLECTED' : 'PENDING',
      });
    }
  }

  const paidTodayCount = borrowerRows.filter((row) => row.paymentStatus === 'COLLECTED').length;
  const pendingTodayCount = borrowerRows.filter((row) => row.paymentStatus === 'PENDING').length;
  const collectionRatePercent =
    expectedPesewas === 0
      ? collectedPesewas > 0
        ? 100
        : 0
      : Math.round((collectedPesewas / expectedPesewas) * 100);

  const summary: CollectorDashboardSummary = {
    date: referenceDate,
    paymentDayLabel: new Date(referenceDate).toLocaleDateString('en-GH', { weekday: 'long' }),
    borrowersDueCount: borrowerRows.length,
    expectedPesewas,
    collectedPesewas,
    outstandingPesewas: Math.max(expectedPesewas - collectedPesewas, 0),
    paidTodayCount,
    pendingTodayCount,
    missedTodayCount: 0,
    collectionRatePercent,
    missedAlertsCount: 0,
    reconciliationStatus: 'PENDING',
    reconciliationVariancePesewas: 0,
  };

  const todayGroups = assignedGroups.map((group) => {
    const groupBorrowers = borrowerRows.filter((row) => row.groupName === group.displayName);
    const groupExpected = groupBorrowers.reduce((sum, row) => sum + row.expectedPesewas, 0);
    const groupCollected = groupBorrowers.reduce((sum, row) => sum + row.collectedPesewas, 0);
    const collectedCount = groupBorrowers.filter((row) => row.paymentStatus === 'COLLECTED').length;

    return {
      groupId: group.id,
      groupName: group.displayName,
      community: group.community,
      leaderName: '—',
      groupPhotoUrl: '',
      collectedCount,
      expectedCount: groupBorrowers.length,
      pendingCount: groupBorrowers.length - collectedCount,
      expectedPesewas: groupExpected,
      amountCollectedPesewas: groupCollected,
      progressPercent:
        groupExpected === 0 ? 0 : Math.round((groupCollected / groupExpected) * 100),
      status: 'ACTIVE',
    };
  });

  const recentPayments = collectorPayments.slice(0, 10).map((payment) => {
    const borrower = borrowers.find((entry) => entry.id === payment.borrowerId);
    return {
      borrowerId: payment.borrowerId,
      borrowerName: borrower?.fullName ?? 'Borrower',
      borrowerPhotoUrl: '',
      groupName: borrower?.groupName ?? '—',
      amountPesewas: payment.amountPesewas,
      recordedAt: payment.recordedAt,
      status: 'COLLECTED' as const,
    };
  });

  return {
    summary,
    hero: {
      targetPesewas: expectedPesewas,
      progressPercent: collectionRatePercent,
      groupsToday: todayGroups.length,
      paidBorrowers: paidTodayCount,
      pendingBorrowers: pendingTodayCount,
      overdueBorrowers: 0,
      streakDays: collectorPayments.length > 0 ? 1 : 0,
      weeklyTrendPercent: 0,
    },
    alerts: [],
    todayGroups,
    recentPayments,
    stats: {
      paymentsRecorded: collectorPayments.length,
      collectionRatePercent,
      borrowersManaged: scopedBorrowers.length,
      groupsAssigned: assignedGroups.length,
    },
    borrowers: borrowerRows,
    missedAlerts: [],
  };
}

export async function listAssignedBorrowers(collectorId: string, date?: string) {
  const dashboard = await getCollectorDashboard(collectorId, date);
  return dashboard.borrowers;
}
