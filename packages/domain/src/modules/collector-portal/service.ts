import { listBorrowers, listPayments } from '../../db/persistence.js';
import * as groupService from '../groups/service.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as paymentRepo from '../../repositories/payment.repository.js';
import * as scheduleRepo from '../../repositories/loan-schedule.repository.js';
import * as reconciliationRepo from '../../repositories/reconciliation.repository.js';
import { isDatabaseEnabled } from '../../db/client.js';
import { decimalToPesewas } from '../../domain/money.js';
import { isLoanDueOnDate, localIsoDate, resolveNextCollectionDueDate } from '../../domain/reconciliation/weekday.js';
import { formatGpsDisplaySummary } from '@wilms/shared-utils';

export interface CollectorDashboardSummary {
  date: string;
  paymentDayLabel: string;
  nextCollectionDueDate: string | null;
  borrowersDueCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  paidTodayCount: number;
  pendingTodayCount: number;
  missedTodayCount: number;
  collectionRatePercent: number;
  missedAlertsCount: number;
  reconciliationStatus: 'PENDING' | 'COMPLETE' | 'VARIANCE' | 'REJECTED' | 'IN_REVIEW';
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
    gpsSummary?: string;
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
    groupId: string;
    groupName: string;
    loanId: string;
    expectedPesewas: number;
    weeklyPaymentPesewas?: number;
    payableWeeksCount?: number;
    collectedPesewas: number;
    paymentStatus: 'COLLECTED' | 'PENDING' | 'MISSED';
    missedWeeksCount?: number;
  }>;
  missedAlerts: Array<{
    borrowerId: string;
    borrowerName: string;
    loanId: string;
    missedWeeks: number;
  }>;
}

function resolveReferenceDate(date?: string): string {
  return date ?? localIsoDate();
}

function mapDashboardReconciliationStatus(input: {
  status?: string | null;
  varianceFlagged?: boolean | null;
  variancePesewas?: number | null;
}): CollectorDashboardSummary['reconciliationStatus'] {
  switch (input.status) {
    case 'APPROVED':
      return 'COMPLETE';
    case 'REJECTED':
      return 'REJECTED';
    case 'PENDING_REVIEW':
    case 'UNDER_INVESTIGATION':
    case 'REOPENED':
    case 'SUBMITTED':
      return input.varianceFlagged || (input.variancePesewas ?? 0) !== 0
        ? 'VARIANCE'
        : 'IN_REVIEW';
    default:
      return 'PENDING';
  }
}

function resolvePaymentStatus(input: {
  weeklyExpected: number;
  collectedForBorrower: number;
  scheduleStatus?: string | null;
}): 'COLLECTED' | 'PENDING' | 'MISSED' {
  if (input.weeklyExpected > 0 && input.collectedForBorrower >= input.weeklyExpected) {
    return 'COLLECTED';
  }
  if (input.scheduleStatus === 'MISSED') {
    return 'MISSED';
  }
  if (input.weeklyExpected > 0) {
    return 'PENDING';
  }
  return 'PENDING';
}

function resolveGroupLeaderName(
  group: { leaderBorrowerId?: string | null; memberIds: string[] },
  borrowers: Array<{ id: string; fullName: string }>,
): string {
  const leaderId = group.leaderBorrowerId ?? group.memberIds[0];
  if (!leaderId) {
    return '—';
  }
  return borrowers.find((borrower) => borrower.id === leaderId)?.fullName ?? '—';
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

  const borrowerGroupId = new Map<string, { groupId: string; groupName: string }>();
  for (const group of assignedGroups) {
    for (const memberId of group.memberIds) {
      borrowerGroupId.set(memberId, { groupId: group.id, groupName: group.displayName });
    }
  }

  const borrowerIds = [...borrowerGroupId.keys()];
  const scopedBorrowers =
    borrowerIds.length > 0
      ? borrowers.filter((borrower) => borrowerGroupId.has(borrower.id))
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
  const paymentDays: string[] = [];

  if (isDatabaseEnabled()) {
    const activeLoans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
    const loansByBorrower = new Map(
      activeLoans
        .filter((loan) => scopedBorrowers.some((borrower) => borrower.id === loan.borrowerId))
        .map((loan) => [loan.borrowerId, loan] as const),
    );
    for (const loan of loansByBorrower.values()) {
      if (loan.paymentDay) {
        paymentDays.push(loan.paymentDay);
      }
    }
    const loanIds = [...loansByBorrower.values()].map((loan) => loan.id);
    const payableWeeks = await scheduleRepo.listPayableScheduleWeeksForLoans(
      loanIds,
      referenceDate,
    );
    const payableByLoanId = new Map<
      string,
      { expectedPesewas: number; hasMissed: boolean; weeksCount: number; missedWeekCount: number }
    >();
    for (const week of payableWeeks) {
      const current = payableByLoanId.get(week.loanId) ?? {
        expectedPesewas: 0,
        hasMissed: false,
        weeksCount: 0,
        missedWeekCount: 0,
      };
      current.expectedPesewas += decimalToPesewas(week.installmentAmount);
      current.weeksCount += 1;
      if (week.status === 'MISSED') {
        current.hasMissed = true;
        current.missedWeekCount += 1;
      }
      payableByLoanId.set(week.loanId, current);
    }

    for (const borrower of scopedBorrowers) {
      const loan = loansByBorrower.get(borrower.id);
      const payable = loan ? payableByLoanId.get(loan.id) : undefined;
      const weeklyInstallment = loan ? decimalToPesewas(loan.installmentAmount) : 0;
      const weeklyExpected =
        payable?.expectedPesewas ??
        (loan && isLoanDueOnDate(loan.paymentDay, referenceDate) ? weeklyInstallment : 0);
      expectedPesewas += weeklyExpected;
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      const groupMeta = borrowerGroupId.get(borrower.id);
      const paymentStatus = resolvePaymentStatus({
        weeklyExpected,
        collectedForBorrower,
        scheduleStatus: payable?.hasMissed ? 'MISSED' : weeklyExpected > 0 ? 'PENDING' : undefined,
      });

      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupId: groupMeta?.groupId ?? borrower.groupId ?? '',
        groupName: groupMeta?.groupName ?? (borrower.groupName || '—'),
        loanId: loan?.id ?? '',
        expectedPesewas: weeklyExpected,
        weeklyPaymentPesewas: weeklyInstallment,
        payableWeeksCount: payable?.weeksCount ?? (weeklyExpected > 0 ? 1 : 0),
        missedWeeksCount: payable?.missedWeekCount ?? 0,
        collectedPesewas: collectedForBorrower,
        paymentStatus,
      });
    }
  } else {
    for (const borrower of scopedBorrowers) {
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      const groupMeta = borrowerGroupId.get(borrower.id);
      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupId: groupMeta?.groupId ?? '',
        groupName: groupMeta?.groupName ?? (borrower.groupName || '—'),
        loanId: '',
        expectedPesewas: 0,
        collectedPesewas: collectedForBorrower,
        paymentStatus: collectedForBorrower > 0 ? 'COLLECTED' : 'PENDING',
      });
    }
  }

  const dueBorrowers = borrowerRows.filter((row) => row.expectedPesewas > 0);
  const paidTodayCount = dueBorrowers.filter((row) => row.paymentStatus === 'COLLECTED').length;
  const missedTodayCount = dueBorrowers.filter((row) => row.paymentStatus === 'MISSED').length;
  const pendingTodayCount = dueBorrowers.filter((row) => row.paymentStatus === 'PENDING').length;
  const collectionRatePercent =
    expectedPesewas === 0
      ? collectedPesewas > 0
        ? 100
        : 0
      : Math.round((collectedPesewas / expectedPesewas) * 100);

  let reconciliationStatus: CollectorDashboardSummary['reconciliationStatus'] = 'PENDING';
  let reconciliationVariancePesewas = 0;

  if (isDatabaseEnabled()) {
    try {
      const recon = await reconciliationRepo.findSubmittedReconciliationByCollectorAndDate(
        collectorId,
        referenceDate,
      );
      if (recon) {
        reconciliationVariancePesewas = recon.primaryVariancePesewas ?? 0;
        reconciliationStatus = mapDashboardReconciliationStatus({
          status: recon.status,
          varianceFlagged: recon.varianceFlagged,
          variancePesewas: reconciliationVariancePesewas,
        });
      }
    } catch {
      // Keep pending if reconciliation lookup fails.
    }
  }

  const summary: CollectorDashboardSummary = {
    date: referenceDate,
    paymentDayLabel: new Date(`${referenceDate}T12:00:00Z`).toLocaleDateString('en-GH', {
      weekday: 'long',
      timeZone: 'UTC',
    }),
    nextCollectionDueDate: resolveNextCollectionDueDate(paymentDays, referenceDate),
    borrowersDueCount: dueBorrowers.length,
    expectedPesewas,
    collectedPesewas,
    outstandingPesewas: Math.max(expectedPesewas - collectedPesewas, 0),
    paidTodayCount,
    pendingTodayCount,
    missedTodayCount,
    collectionRatePercent,
    missedAlertsCount: missedTodayCount,
    reconciliationStatus,
    reconciliationVariancePesewas,
  };

  const todayGroups = assignedGroups
    .map((group) => {
      const groupBorrowers = borrowerRows.filter((row) => row.groupId === group.id);
      const dueGroupBorrowers = groupBorrowers.filter((row) => row.expectedPesewas > 0);
      const groupExpected = dueGroupBorrowers.reduce((sum, row) => sum + row.expectedPesewas, 0);
      const groupCollected = dueGroupBorrowers.reduce((sum, row) => sum + row.collectedPesewas, 0);
      const collectedCount = dueGroupBorrowers.filter(
        (row) => row.paymentStatus === 'COLLECTED',
      ).length;
      const pendingCount = dueGroupBorrowers.filter(
        (row) => row.paymentStatus === 'PENDING',
      ).length;

      return {
        groupId: group.id,
        groupName: group.displayName,
        community: group.community,
        leaderName: resolveGroupLeaderName(group, borrowers),
        groupPhotoUrl: '',
        collectedCount,
        expectedCount: dueGroupBorrowers.length,
        pendingCount,
        expectedPesewas: groupExpected,
        amountCollectedPesewas: groupCollected,
        progressPercent:
          groupExpected === 0 ? 0 : Math.round((groupCollected / groupExpected) * 100),
        status: 'ACTIVE',
      };
    })
    .filter((group) => group.expectedCount > 0);

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
      gpsSummary: formatGpsDisplaySummary({
        ...payment.gps,
        source: payment.gps?.unavailable ? 'exception' : payment.gps ? 'device' : undefined,
      }),
    };
  });

  const missedAlerts = dueBorrowers
    .filter((row) => row.paymentStatus === 'MISSED')
    .map((row) => ({
      borrowerId: row.borrowerId,
      borrowerName: row.borrowerName,
      loanId: row.loanId,
      missedWeeks: Math.max(row.missedWeeksCount ?? 1, 1),
    }));

  return {
    summary,
    hero: {
      targetPesewas: expectedPesewas,
      progressPercent: collectionRatePercent,
      groupsToday: todayGroups.filter((group) => group.expectedCount > 0).length,
      paidBorrowers: paidTodayCount,
      pendingBorrowers: pendingTodayCount,
      overdueBorrowers: missedTodayCount,
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
    // Only borrowers with a due installment on the reference date (not the full assigned book).
    borrowers: dueBorrowers,
    missedAlerts,
  };
}

export async function listAssignedBorrowers(collectorId: string, date?: string) {
  const referenceDate = resolveReferenceDate(date);
  const useDb = isDatabaseEnabled();
  const [borrowers, payments, assignedGroups] = await Promise.all([
    listBorrowers(),
    useDb
      ? paymentRepo.listPaymentsForDate(referenceDate, { collectorId })
      : listPayments(),
    groupService.getGroupsForCollector(collectorId),
  ]);

  const borrowerGroupId = new Map<string, { groupId: string; groupName: string }>();
  for (const group of assignedGroups) {
    for (const memberId of group.memberIds) {
      borrowerGroupId.set(memberId, { groupId: group.id, groupName: group.displayName });
    }
  }

  const scopedBorrowers =
    borrowerGroupId.size > 0
      ? borrowers.filter((borrower) => borrowerGroupId.has(borrower.id))
      : [];

  const collectorPayments = useDb
    ? payments
    : payments.filter(
        (payment) =>
          payment.collectorId === collectorId && payment.paymentDate === referenceDate,
      );

  const borrowerRows: CollectorDashboard['borrowers'] = [];

  if (isDatabaseEnabled()) {
    const borrowerIds = scopedBorrowers.map((borrower) => borrower.id);
    const allLoans = await loanRepo.listLoansForBorrowerIds(borrowerIds);
    const activeLoans = allLoans.filter((loan) => loan.externalStatus === 'ACTIVE');
    const loansByBorrower = new Map<string, typeof allLoans>();
    for (const loan of allLoans) {
      const list = loansByBorrower.get(loan.borrowerId) ?? [];
      list.push(loan);
      loansByBorrower.set(loan.borrowerId, list);
    }

    const loanIds = activeLoans.map((loan) => loan.id);
    const payableWeeks = await scheduleRepo.listPayableScheduleWeeksForLoans(
      loanIds,
      referenceDate,
    );
    const payableByLoanId = new Map<
      string,
      { expectedPesewas: number; hasMissed: boolean; weeksCount: number; missedWeekCount: number }
    >();
    for (const week of payableWeeks) {
      const current = payableByLoanId.get(week.loanId) ?? {
        expectedPesewas: 0,
        hasMissed: false,
        weeksCount: 0,
        missedWeekCount: 0,
      };
      current.expectedPesewas += decimalToPesewas(week.installmentAmount);
      current.weeksCount += 1;
      if (week.status === 'MISSED') {
        current.hasMissed = true;
        current.missedWeekCount += 1;
      }
      payableByLoanId.set(week.loanId, current);
    }

    for (const borrower of scopedBorrowers) {
      const borrowerLoans = loansByBorrower.get(borrower.id) ?? [];
      const activeLoan = borrowerLoans.find((loan) => loan.externalStatus === 'ACTIVE');
      const profileLoan =
        activeLoan ??
        [...borrowerLoans].sort(
          (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
        )[0];
      const loan = activeLoan;
      const payable = loan ? payableByLoanId.get(loan.id) : undefined;
      const weeklyInstallment = loan ? decimalToPesewas(loan.installmentAmount) : 0;
      const weeklyExpected =
        payable?.expectedPesewas ??
        (loan && isLoanDueOnDate(loan.paymentDay, referenceDate) ? weeklyInstallment : 0);
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      const groupMeta = borrowerGroupId.get(borrower.id);
      const hasCompletedLoanOnly =
        !activeLoan && borrowerLoans.some((entry) => entry.externalStatus === 'COMPLETED');
      const paymentStatus = hasCompletedLoanOnly
        ? ('COLLECTED' as const)
        : resolvePaymentStatus({
            weeklyExpected,
            collectedForBorrower,
            scheduleStatus: payable?.hasMissed
              ? 'MISSED'
              : weeklyExpected > 0
                ? 'PENDING'
                : undefined,
          });

      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupId: groupMeta?.groupId ?? borrower.groupId ?? '',
        groupName: groupMeta?.groupName ?? (borrower.groupName || '—'),
        loanId: profileLoan?.id ?? '',
        expectedPesewas: weeklyExpected,
        weeklyPaymentPesewas: weeklyInstallment,
        payableWeeksCount: payable?.weeksCount ?? (weeklyExpected > 0 ? 1 : 0),
        missedWeeksCount: payable?.missedWeekCount ?? 0,
        collectedPesewas: collectedForBorrower,
        paymentStatus,
      });
    }
  } else {
    for (const borrower of scopedBorrowers) {
      const collectedForBorrower = collectorPayments
        .filter((payment) => payment.borrowerId === borrower.id)
        .reduce((sum, payment) => sum + payment.amountPesewas, 0);
      const groupMeta = borrowerGroupId.get(borrower.id);
      borrowerRows.push({
        borrowerId: borrower.id,
        borrowerName: borrower.fullName,
        phone: borrower.phone,
        community: borrower.community,
        groupId: groupMeta?.groupId ?? '',
        groupName: groupMeta?.groupName ?? (borrower.groupName || '—'),
        loanId: '',
        expectedPesewas: 0,
        collectedPesewas: collectedForBorrower,
        paymentStatus: collectedForBorrower > 0 ? 'COLLECTED' : 'PENDING',
      });
    }
  }

  return borrowerRows.sort((left, right) => left.borrowerName.localeCompare(right.borrowerName));
}
