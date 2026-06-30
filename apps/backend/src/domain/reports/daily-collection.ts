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

export function buildDailyCollectionReport(input: {
  date: string;
  payments: PaymentRecord[];
  loans?: DailyCollectionLoanContext[];
  borrowerNames: Map<string, { fullName: string; community: string }>;
  collectorNames: Map<string, string>;
  collectorId?: string;
}): DailyCollectionReport {
  const activeLoans = (input.loans ?? []).filter((loan) => loan.status === 'ACTIVE');
  const dueLoans = activeLoans.filter((loan) => isLoanDueOnDate(loan.paymentDay, input.date));
  const expectedByBorrower = new Map(
    dueLoans.map((loan) => [loan.borrowerId, loan.weeklyPaymentPesewas]),
  );

  let repayments = input.payments.filter((payment) => payment.paymentDate === input.date);
  if (input.collectorId) {
    repayments = repayments.filter((payment) => payment.collectorId === input.collectorId);
  }

  const resolveBorrowerContext = (
    borrowerId: string,
    loanId?: string,
  ): Pick<DailyCollectionReportRow, 'borrowerName' | 'community' | 'loanId' | 'expectedPesewas'> => {
    const borrower = input.borrowerNames.get(borrowerId);
    const loan =
      (loanId ? activeLoans.find((entry) => entry.id === loanId) : undefined) ??
      activeLoans.find((entry) => entry.borrowerId === borrowerId);

    return {
      borrowerName: loan?.borrowerName ?? borrower?.fullName ?? 'Unknown borrower',
      community: loan?.community ?? borrower?.community ?? '—',
      loanId: loan?.id,
      expectedPesewas: 0,
    };
  };

  const rows: DailyCollectionReportRow[] = repayments.map((payment) => {
    const borrowerContext = resolveBorrowerContext(payment.borrowerId);
    const expectedPesewas = expectedByBorrower.get(payment.borrowerId) ?? 0;

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
      expectedPesewas: loan.weeklyPaymentPesewas,
      collectedPesewas: 0,
      variancePesewas: -loan.weeklyPaymentPesewas,
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

  const expectedPesewas = dueLoans.reduce((total, loan) => total + loan.weeklyPaymentPesewas, 0);
  const collectedPesewas = repayments.reduce((total, repayment) => total + repayment.amountPesewas, 0);
  const borrowersPaidCount = dueLoans.filter((loan) => {
    const collected = repayments
      .filter((repayment) => repayment.borrowerId === loan.borrowerId)
      .reduce((total, repayment) => total + repayment.amountPesewas, 0);
    return collected >= loan.weeklyPaymentPesewas;
  }).length;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      date: input.date,
      paymentDayLabel: getWeekdayNameFromIsoDate(input.date),
      borrowersDueCount: dueLoans.length,
      borrowersPaidCount,
      expectedPesewas,
      collectedPesewas,
      variancePesewas: collectedPesewas - expectedPesewas,
      collectorsActiveCount: new Set(repayments.map((repayment) => repayment.collectorId)).size,
    },
    rows,
  };
}
