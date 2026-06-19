import { MOCK_PAYMENT_TRANSACTIONS } from '@/mocks/payments';
import type { PaymentTransaction } from '@/types/payment';

let paymentTransactions: PaymentTransaction[] = [...MOCK_PAYMENT_TRANSACTIONS];

export function getPaymentTransactions(): readonly PaymentTransaction[] {
  return paymentTransactions;
}

export function appendPaymentTransaction(transaction: PaymentTransaction): void {
  paymentTransactions = [...paymentTransactions, transaction];
}

export function findPaymentTransaction(id: string): PaymentTransaction | undefined {
  return paymentTransactions.find((transaction) => transaction.id === id);
}

export function updatePaymentTransaction(
  id: string,
  updates: Partial<PaymentTransaction>,
): PaymentTransaction | undefined {
  const index = paymentTransactions.findIndex((transaction) => transaction.id === id);

  if (index === -1) {
    return undefined;
  }

  const updated = { ...paymentTransactions[index], ...updates };
  paymentTransactions = [
    ...paymentTransactions.slice(0, index),
    updated,
    ...paymentTransactions.slice(index + 1),
  ];

  return updated;
}

export function findSameDayPayment(
  borrowerId: string,
  collectorId: string,
  paymentDate: string,
): PaymentTransaction | undefined {
  return paymentTransactions.find(
    (transaction) =>
      transaction.borrowerId === borrowerId &&
      transaction.collectorId === collectorId &&
      transaction.paymentDate === paymentDate,
  );
}

export function resetPaymentTransactions(): void {
  paymentTransactions = [...MOCK_PAYMENT_TRANSACTIONS];
}
