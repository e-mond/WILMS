import type {
  FinancialLedgerReport,
  FinancialLedgerReportParams,
} from '@/types/reports';
import type { FinancialTransaction } from '@/types/transaction';

export function buildFinancialLedgerReport(
  transactions: readonly FinancialTransaction[],
  params: FinancialLedgerReportParams = {},
): FinancialLedgerReport {
  const rows = [...transactions]
    .filter((transaction) => {
      const recordedDate = transaction.recordedAt.slice(0, 10);

      if (params.fromDate && recordedDate < params.fromDate) {
        return false;
      }

      if (params.toDate && recordedDate > params.toDate) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        new Date(right.recordedAt).getTime() - new Date(left.recordedAt).getTime(),
    )
    .map((transaction) => ({
      id: transaction.id,
      type: transaction.type,
      borrowerId: transaction.borrowerId,
      loanId: transaction.loanId,
      amountPesewas: transaction.amountPesewas,
      collectorId: transaction.collectorId,
      recordedAt: transaction.recordedAt,
    }));

  return {
    generatedAt: new Date().toISOString(),
    rows,
  };
}
