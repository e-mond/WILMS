import { RECONCILIATION_VARIANCE_THRESHOLD_PERCENT } from '@/constants/reconciliation';
import type {
  CollectorDashboardLoanInput,
  CollectorDashboardPaymentInput,
} from '@/features/payment-collection/collector-dashboard.utils';
import { isLoanDueOnDate } from '@/utils/weekday';

export interface ReconciliationTotals {
  expectedPesewas: number;
  actualPesewas: number;
}

export function buildReconciliationTotals(
  collectorId: string,
  date: string,
  loans: CollectorDashboardLoanInput[],
  payments: CollectorDashboardPaymentInput[],
): ReconciliationTotals {
  const dueLoans = loans.filter((loan) => isLoanDueOnDate(loan.paymentDay, date));
  const expectedPesewas = dueLoans.reduce((total, loan) => total + loan.weeklyPaymentPesewas, 0);
  const actualPesewas = payments
    .filter((payment) => payment.collectorId === collectorId && payment.paymentDate === date)
    .reduce((total, payment) => total + payment.amountPesewas, 0);

  return { expectedPesewas, actualPesewas };
}

export function calculatePhysicalCashVariance(
  physicalCashPesewas: number,
  actualPesewas: number,
): number {
  return physicalCashPesewas - actualPesewas;
}

export function isVarianceAboveThreshold(
  variancePesewas: number,
  expectedPesewas: number,
  thresholdPercent: number = RECONCILIATION_VARIANCE_THRESHOLD_PERCENT,
): boolean {
  if (expectedPesewas === 0) {
    return Math.abs(variancePesewas) > 0;
  }

  const variancePercent = (Math.abs(variancePesewas) / expectedPesewas) * 100;

  return variancePercent > thresholdPercent;
}
