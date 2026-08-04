/**
 * P14.3B Phase 3C.1 — Payment reversal balance computation.
 *
 * Reversal credits the loan by the payment amount (inverse of postPayment debit).
 */
import { LOAN_LIFECYCLE, type LoanLifecycleStatus } from '../loan/lifecycle.js';

export interface PaymentReversalBalanceEffect {
  beforeBalancePesewas: number;
  afterBalancePesewas: number;
  deltaPesewas: number;
  lifecycleStatus: LoanLifecycleStatus;
}

export function computePaymentReversalBalance(
  currentBalancePesewas: number,
  paymentAmountPesewas: number,
  currentLifecycle: LoanLifecycleStatus,
): PaymentReversalBalanceEffect {
  const beforeBalancePesewas = Math.max(currentBalancePesewas, 0);
  const afterBalancePesewas = beforeBalancePesewas + paymentAmountPesewas;

  let lifecycleStatus = currentLifecycle;
  if (currentLifecycle === LOAN_LIFECYCLE.COMPLETED) {
    lifecycleStatus = LOAN_LIFECYCLE.ACTIVE;
  }

  return {
    beforeBalancePesewas,
    afterBalancePesewas,
    deltaPesewas: paymentAmountPesewas,
    lifecycleStatus,
  };
}
