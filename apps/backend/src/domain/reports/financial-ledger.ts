import type { PaymentRecord } from '../../db/store.js';

export interface FinancialLedgerReportParams {
  fromDate?: string;
  toDate?: string;
}

export interface FinancialLedgerReportRow {
  id: string;
  type: string;
  borrowerId: string;
  loanId?: string;
  amountPesewas: number;
  collectorId: string;
  recordedAt: string;
}

export interface FinancialLedgerReport {
  generatedAt: string;
  rows: FinancialLedgerReportRow[];
}

export function buildFinancialLedgerReport(
  payments: PaymentRecord[],
  params: FinancialLedgerReportParams = {},
): FinancialLedgerReport {
  const rows = [...payments]
    .filter((payment) => {
      const recordedDate = payment.paymentDate;

      if (params.fromDate && recordedDate < params.fromDate) {
        return false;
      }

      if (params.toDate && recordedDate > params.toDate) {
        return false;
      }

      return true;
    })
    .sort((left, right) => right.recordedAt.localeCompare(left.recordedAt))
    .map((payment) => ({
      id: payment.id,
      type: 'REPAYMENT',
      borrowerId: payment.borrowerId,
      amountPesewas: payment.amountPesewas,
      collectorId: payment.collectorId,
      recordedAt: payment.recordedAt,
    }));

  return {
    generatedAt: new Date().toISOString(),
    rows,
  };
}
