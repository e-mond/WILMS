import { LOAN_STATUS, type LoanPortfolioEntry } from '@/types/loan';
import type { DailyCollectionReport, DailyCollectionReportRow } from '@/types/reports';
import { TRANSACTION_TYPE, type FinancialTransaction } from '@/types/transaction';
import { getWeekdayNameFromIsoDate, isLoanDueOnDate } from '@/utils/weekday';
import { resolveCollectorDisplayId, resolveLoanDisplayId } from '@/utils/entity-display-id';

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

function resolveCollectorName(collectorId: string, collectorName?: string): string {
  if (collectorName?.trim()) {
    return collectorName.trim();
  }
  if (!collectorId) {
    return 'Collector';
  }
  return resolveCollectorDisplayId({ id: collectorId });
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
    loanId: loan ? resolveLoanDisplayId(loan) : loanId,
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
      loanId: resolveLoanDisplayId(loan),
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

/** Normalize legacy flat API payloads `{ date, rows, totalPesewas }` into `DailyCollectionReport`. */
export function normalizeDailyCollectionReport(
  payload: Partial<DailyCollectionReport> & {
    date?: string;
    totalPesewas?: number;
    rows?: DailyCollectionReportRow[];
  },
  requestedDate: string,
): DailyCollectionReport {
  if (payload.summary?.date) {
    return {
      generatedAt: payload.generatedAt ?? new Date().toISOString(),
      summary: payload.summary,
      rows: payload.rows ?? [],
    };
  }

  const date = payload.date ?? requestedDate;
  const rows = (payload.rows ?? []).map((row, index) => ({
    id: row.id ?? `row-${index}`,
    borrowerId: row.borrowerId ?? '',
    borrowerName: row.borrowerName ?? '—',
    community: row.community ?? '—',
    loanId: row.loanId,
    collectorId: row.collectorId ?? '',
    collectorName: row.collectorName ?? '—',
    expectedPesewas: row.expectedPesewas ?? 0,
    collectedPesewas: row.collectedPesewas ?? 0,
    variancePesewas: row.variancePesewas ?? 0,
    recordedAt: row.recordedAt,
  }));

  const collectedFromRows = rows.reduce((total, row) => total + row.collectedPesewas, 0);
  const collectedPesewas = payload.totalPesewas ?? collectedFromRows;
  const expectedPesewas = rows.reduce((total, row) => total + row.expectedPesewas, 0);

  return {
    generatedAt: payload.generatedAt ?? new Date().toISOString(),
    summary: {
      date,
      paymentDayLabel: getWeekdayNameFromIsoDate(date),
      borrowersDueCount: rows.length,
      borrowersPaidCount: rows.filter((row) => row.collectedPesewas > 0).length,
      expectedPesewas,
      collectedPesewas,
      variancePesewas: collectedPesewas - expectedPesewas,
      collectorsActiveCount: new Set(rows.map((row) => row.collectorId).filter(Boolean)).size,
    },
    rows,
  };
}
