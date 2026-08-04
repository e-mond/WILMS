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

/** Absolute floor (1 GHS) — mirrors domain ABSOLUTE_VARIANCE_FLOOR_PESEWAS. */
export const ABSOLUTE_VARIANCE_FLOOR_PESEWAS = 100;

/**
 * ExpectedCashFormula v1 — matches backend `calculateExpectedDuePesewas`.
 */
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

/**
 * Primary variance v1 — matches backend `calculatePrimaryVariancePesewas`:
 * physical_cash − expected_due
 */
export function calculatePrimaryVariancePesewas(
  physicalCashPesewas: number,
  expectedDuePesewas: number,
): number {
  return physicalCashPesewas - expectedDuePesewas;
}

/**
 * Matches domain `isVarianceFlagged` so FE preview shows the comment field
 * before submit (including expected=0 with any physical cash).
 */
export function isVarianceAboveThreshold(
  primaryVariancePesewas: number,
  expectedDuePesewas: number,
  thresholdPercent: number = RECONCILIATION_VARIANCE_THRESHOLD_PERCENT,
  collectionDeltaPesewas = 0,
): boolean {
  if (collectionDeltaPesewas !== 0) {
    return true;
  }

  if (expectedDuePesewas === 0) {
    return primaryVariancePesewas !== 0;
  }

  if (Math.abs(primaryVariancePesewas) >= ABSOLUTE_VARIANCE_FLOOR_PESEWAS) {
    return true;
  }

  const variancePercent = (Math.abs(primaryVariancePesewas) / expectedDuePesewas) * 100;
  return variancePercent > thresholdPercent;
}
