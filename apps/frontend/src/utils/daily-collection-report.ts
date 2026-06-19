import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import { LOAN_STATUS, type LoanPortfolioEntry } from '@/types/loan';
import type { DailyCollectionReport, DailyCollectionReportRow } from '@/types/reports';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import { getWeekdayNameFromIsoDate, isLoanDueOnDate } from '@/utils/weekday';

export interface DailyCollectionRepaymentInput {
  id: string;
  borrowerId: string;
  loanId?: string;
  amountPesewas: number;
  collectorId: string;
  recordedAt: string;
}

export interface BuildDailyCollectionReportInput {
  date: string;
  loans: LoanPortfolioEntry[];
  repayments: DailyCollectionRepaymentInput[];
  collectorId?: string;
}

function resolveCollectorName(collectorId: string): string {
  return DEMO_ACCOUNTS.find((account) => account.id === collectorId)?.displayName ?? 'Collector';
}

function resolveBorrowerContext(
  borrowerId: string,
  loanId: string | undefined,
  loans: LoanPortfolioEntry[],
): Pick<DailyCollectionReportRow, 'borrowerName' | 'community' | 'loanId' | 'expectedPesewas'> {
  const loan =
    (loanId ? loans.find((entry) => entry.id === loanId) : undefined) ??
    loans.find((entry) => entry.borrowerId === borrowerId);

  return {
    borrowerName: loan?.borrowerName ?? 'Unknown borrower',
    community: loan?.community ?? '—',
    loanId: loan?.id,
    expectedPesewas: 0,
  };
}

export function extractRepaymentsFromTransactions(
  transactions: readonly FinancialTransaction[],
  date: string,
): DailyCollectionRepaymentInput[] {
  return transactions
    .filter(
      (transaction) =>
        transaction.type === TRANSACTION_TYPE.REPAYMENT &&
        transaction.recordedAt.slice(0, 10) === date,
    )
    .map((transaction) => ({
      id: transaction.id,
      borrowerId: transaction.borrowerId,
      loanId: transaction.loanId,
      amountPesewas: transaction.amountPesewas,
      collectorId: transaction.collectorId,
      recordedAt: transaction.recordedAt,
    }));
}

export function buildDailyCollectionReport(
  input: BuildDailyCollectionReportInput,
): DailyCollectionReport {
  const activeLoans = input.loans.filter((loan) => loan.status === LOAN_STATUS.ACTIVE);
  const dueLoans = activeLoans.filter((loan) => isLoanDueOnDate(loan.paymentDay, input.date));
  const expectedByBorrower = new Map(
    dueLoans.map((loan) => [loan.borrowerId, loan.weeklyPaymentPesewas]),
  );

  const repayments = input.collectorId
    ? input.repayments.filter((repayment) => repayment.collectorId === input.collectorId)
    : input.repayments;

  const rows: DailyCollectionReportRow[] = repayments.map((repayment) => {
    const borrowerContext = resolveBorrowerContext(
      repayment.borrowerId,
      repayment.loanId,
      activeLoans,
    );
    const expectedPesewas = expectedByBorrower.get(repayment.borrowerId) ?? 0;

    return {
      id: repayment.id,
      borrowerId: repayment.borrowerId,
      borrowerName: borrowerContext.borrowerName,
      community: borrowerContext.community,
      loanId: borrowerContext.loanId,
      collectorId: repayment.collectorId,
      collectorName: resolveCollectorName(repayment.collectorId),
      expectedPesewas,
      collectedPesewas: repayment.amountPesewas,
      variancePesewas: repayment.amountPesewas - expectedPesewas,
      recordedAt: repayment.recordedAt,
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
  const collectedPesewas = repayments.reduce(
    (total, repayment) => total + repayment.amountPesewas,
    0,
  );
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
