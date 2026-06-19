import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getAllMockLoans } from '@/services/mock/loanService.mock';
import { getStoredLoanSchedule } from '@/services/mock/loan-schedule.store';
import { getTransactionsForLoan } from '@/services/mock/transaction-log.store';
import { LOAN_STATUS } from '@/types/loan';
import type { DefaulterReport, DefaulterReportRow } from '@/types/reports';
import { TRANSACTION_TYPE } from '@/types/transaction';
import { countMissedWeeks } from '@/utils/schedule-missed-marking';

function getLastRepaymentDate(loanId: string): string | undefined {
  const repayments = getTransactionsForLoan(loanId)
    .filter((transaction) => transaction.type === TRANSACTION_TYPE.REPAYMENT)
    .sort(
      (left, right) =>
        new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
    );

  return repayments[0]?.recordedAt.slice(0, 10);
}

export function buildDefaulterReport(referenceDate?: string): DefaulterReport {
  const date = referenceDate ?? new Date().toISOString().slice(0, 10);
  const defaultedLoans = getAllMockLoans().filter((loan) => loan.status === LOAN_STATUS.DEFAULTED);

  const rows: DefaulterReportRow[] = defaultedLoans.map((loan) => {
    const borrower = getBorrowerRegistryEntry(loan.borrowerId);
    const schedule = getStoredLoanSchedule(loan.id, date) ?? [];

    return {
      id: `def-${loan.id}`,
      borrowerId: loan.borrowerId,
      borrowerName: borrower?.fullName ?? loan.borrowerId,
      community: borrower?.community ?? '—',
      groupName: borrower?.groupName ?? '—',
      missedWeeks: countMissedWeeks(schedule),
      outstandingPesewas: loan.outstandingPesewas,
      lastPaymentDate: getLastRepaymentDate(loan.id),
    };
  });

  const totalOutstandingPesewas = rows.reduce((total, row) => total + row.outstandingPesewas, 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDefaulters: rows.length,
      totalOutstandingPesewas,
    },
    rows,
  };
}
