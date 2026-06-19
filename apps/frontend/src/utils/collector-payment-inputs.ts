import { getPaymentTransactions } from '@/services/mock/payment-transaction.store';
import { getFinancialTransactions } from '@/services/mock/transaction-log.store';
import { TRANSACTION_TYPE } from '@/types/transaction';
import type { CollectorDashboardPaymentInput } from '@/features/payment-collection/collector-dashboard.utils';

export function buildCollectorPaymentInputs(
  referenceDate: string,
): CollectorDashboardPaymentInput[] {
  const fieldPayments = getPaymentTransactions().map((payment) => ({
    borrowerId: payment.borrowerId,
    amountPesewas: payment.amountPesewas,
    collectorId: payment.collectorId,
    paymentDate: payment.paymentDate,
    recordedAt: `${payment.paymentDate}T10:00:00.000Z`,
  }));

  const ledgerRepayments = getFinancialTransactions()
    .filter((transaction) => transaction.type === TRANSACTION_TYPE.REPAYMENT)
    .map((transaction) => ({
      borrowerId: transaction.borrowerId,
      amountPesewas: transaction.amountPesewas,
      collectorId: transaction.collectorId,
      paymentDate: transaction.recordedAt.slice(0, 10),
      recordedAt: transaction.recordedAt,
    }));

  return [...fieldPayments, ...ledgerRepayments].filter(
    (payment) => payment.paymentDate === referenceDate,
  );
}
