import type { PaymentRecord } from '../../db/store.js';
import { getWeekdayNameFromIsoDate, isLoanDueOnDate } from '../reconciliation/weekday.js';

export interface DailyCollectionLoanContext {
  id: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  weeklyPaymentPesewas: number;
  paymentDay: string;
  status: string;
}

export interface DailyCollectionScheduleDue {
  loanId: string;
  installmentPesewas: number;
}

export interface DailyCollectionReportSummary {
  date: string;
  paymentDayLabel: string;
  borrowersDueCount: number;
  borrowersPaidCount: number;
  expectedPesewas: number;
  collectedPesewas: number;
  variancePesewas: number;
  collectorsActiveCount: number;
}

export interface DailyCollectionReportRow {
  id: string;
  borrowerId: string;
  borrowerName: string;
  community: string;
  loanId?: string;
  collectorId: string;
  collectorName: string;
  expectedPesewas: number;
  collectedPesewas: number;
  variancePesewas: number;
  recordedAt?: string;
}

export interface DailyCollectionReport {
  generatedAt: string;
  summary: DailyCollectionReportSummary;
  rows: DailyCollectionReportRow[];
}

function resolveDueLoans(
  activeLoans: DailyCollectionLoanContext[],
  date: string,
  scheduleDues: DailyCollectionScheduleDue[],
): Array<DailyCollectionLoanContext & { expectedPesewas: number }> {
  const scheduleByLoanId = new Map(
    scheduleDues.map((due) => [due.loanId, due.installmentPesewas] as const),
  );
  const due: Array<DailyCollectionLoanContext & { expectedPesewas: number }> = [];

  for (const loan of activeLoans) {
    const scheduleExpected = scheduleByLoanId.get(loan.id);
    if (typeof scheduleExpected === 'number') {
      due.push({ ...loan, expectedPesewas: scheduleExpected });
      continue;
    }
    if (isLoanDueOnDate(loan.paymentDay, date)) {
      due.push({ ...loan, expectedPesewas: loan.weeklyPaymentPesewas });
    }
  }

  return due;
}

export function buildDailyCollectionReport(input: {
  date: string;
  payments: PaymentRecord[];
  loans?: DailyCollectionLoanContext[];
  scheduleDues?: DailyCollectionScheduleDue[];
  borrowerNames: Map<string, { fullName: string; community: string }>;
  collectorNames: Map<string, string>;
  collectorId?: string;
}): DailyCollectionReport {
  const activeLoans = (input.loans ?? []).filter((loan) => loan.status === 'ACTIVE');
  const dueLoans = resolveDueLoans(activeLoans, input.date, input.scheduleDues ?? []);
  const expectedByBorrower = new Map(
    dueLoans.map((loan) => [loan.borrowerId, loan.expectedPesewas]),
  );

  let repayments = input.payments.filter((payment) => payment.paymentDate === input.date);
  if (input.collectorId) {
    repayments = repayments.filter((payment) => payment.collectorId === input.collectorId);
  }

  const resolveBorrowerContext = (
    borrowerId: string,
    loanId?: string,
  ): Pick<DailyCollectionReportRow, 'borrowerName' | 'community' | 'loanId'> => {
    const borrower = input.borrowerNames.get(borrowerId);
    const loan =
      (loanId ? activeLoans.find((entry) => entry.id === loanId) : undefined) ??
      activeLoans.find((entry) => entry.borrowerId === borrowerId);

    return {
      borrowerName: loan?.borrowerName ?? borrower?.fullName ?? 'Unknown borrower',
      community: loan?.community ?? borrower?.community ?? '—',
      loanId: loan?.id,
    };
  };

  const rows: DailyCollectionReportRow[] = repayments.map((payment) => {
    const borrowerContext = resolveBorrowerContext(payment.borrowerId);
    // Payments collected on the day still show expected even when schedule
    // shifted — fall back to the loan weekly installment when not in due set.
    const loan =
      activeLoans.find((entry) => entry.borrowerId === payment.borrowerId);
    const expectedPesewas =
      expectedByBorrower.get(payment.borrowerId) ?? loan?.weeklyPaymentPesewas ?? 0;

    return {
      id: payment.id,
      borrowerId: payment.borrowerId,
      borrowerName: borrowerContext.borrowerName,
      community: borrowerContext.community,
      loanId: borrowerContext.loanId,
      collectorId: payment.collectorId,
      collectorName: input.collectorNames.get(payment.collectorId) ?? 'Collector',
      expectedPesewas,
      collectedPesewas: payment.amountPesewas,
      variancePesewas: payment.amountPesewas - expectedPesewas,
      recordedAt: payment.recordedAt,
    };
  });

  const paidBorrowerIds = new Set(repayments.map((repayment) => repayment.borrowerId));

  for (const loan of dueLoans) {
    if (paidBorrowerIds.has(loan.borrowerId)) {
      continue;
    }

    rows.push({
      id: `due-${loan.id}-${input.date}`,
      borrowerId: loan.borrowerId,
      borrowerName: loan.borrowerName,
      community: loan.community,
      loanId: loan.id,
      collectorId: '',
      collectorName: '—',
      expectedPesewas: loan.expectedPesewas,
      collectedPesewas: 0,
      variancePesewas: -loan.expectedPesewas,
    });
  }

  rows.sort((left, right) => {
    if (left.recordedAt && right.recordedAt) {
      return left.recordedAt.localeCompare(right.recordedAt);
    }
    if (left.recordedAt) {
      return -1;
    }
    if (right.recordedAt) {
      return 1;
    }
    return left.borrowerName.localeCompare(right.borrowerName);
  });

  const expectedPesewas = dueLoans.reduce((total, loan) => total + loan.expectedPesewas, 0);
  // Include expected for paid borrowers who were not in the due set (holiday
  // shift / off-day collection) so Summary Expected matches the detail table.
  const paidOutsideDueExpected = repayments.reduce((total, payment) => {
    if (expectedByBorrower.has(payment.borrowerId)) {
      return total;
    }
    const loan = activeLoans.find((entry) => entry.borrowerId === payment.borrowerId);
    return total + (loan?.weeklyPaymentPesewas ?? 0);
  }, 0);
  const totalExpectedPesewas = expectedPesewas + paidOutsideDueExpected;

  const collectedPesewas = repayments.reduce((total, repayment) => total + repayment.amountPesewas, 0);
  const borrowersPaidCount = dueLoans.filter((loan) => {
    const collected = repayments
      .filter((repayment) => repayment.borrowerId === loan.borrowerId)
      .reduce((total, repayment) => total + repayment.amountPesewas, 0);
    return collected >= loan.expectedPesewas;
  }).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      date: input.date,
      paymentDayLabel: getWeekdayNameFromIsoDate(input.date),
      borrowersDueCount: dueLoans.length + (paidOutsideDueExpected > 0
        ? new Set(
            repayments
              .filter((payment) => !expectedByBorrower.has(payment.borrowerId))
              .map((payment) => payment.borrowerId),
          ).size
        : 0),
      borrowersPaidCount,
      expectedPesewas: totalExpectedPesewas,
      collectedPesewas,
      variancePesewas: collectedPesewas - totalExpectedPesewas,
      collectorsActiveCount: new Set(repayments.map((repayment) => repayment.collectorId)).size,
    },
    rows,
  };
}
