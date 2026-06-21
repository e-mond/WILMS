/**
 * P14.3B Phase 2 — Adjustment balance effect calculations.
 *
 * Business rules:
 * - PAYMENT_CORRECTION: credits borrower (reduces outstanding balance).
 * - DISBURSEMENT_CORRECTION: increases principal owed when under-recorded.
 * - BALANCE_ADJUSTMENT: administrative credit reducing balance.
 * - WRITE_OFF: zeroes balance; delta equals full outstanding amount.
 *
 * All amounts are in pesewas. No direct balance mutation occurs here — service layer
 * applies the computed afterBalance inside a transaction after optimistic lock check.
 */
import type { AdjustmentType } from './types.js';

export interface BalanceEffect {
  /** Outstanding balance before adjustment (pesewas). */
  beforeBalancePesewas: number;
  /** Outstanding balance after adjustment (pesewas). */
  afterBalancePesewas: number;
  /** Signed change applied to balance (pesewas). Negative reduces balance. */
  deltaPesewas: number;
}

export function computeBalanceEffect(
  type: AdjustmentType,
  amountPesewas: number,
  currentBalancePesewas: number,
): BalanceEffect {
  const beforeBalancePesewas = Math.max(currentBalancePesewas, 0);

  switch (type) {
    case 'PAYMENT_CORRECTION': {
      const afterBalancePesewas = Math.max(beforeBalancePesewas - amountPesewas, 0);
      return {
        beforeBalancePesewas,
        afterBalancePesewas,
        deltaPesewas: afterBalancePesewas - beforeBalancePesewas,
      };
    }
    case 'DISBURSEMENT_CORRECTION': {
      const afterBalancePesewas = beforeBalancePesewas + amountPesewas;
      return {
        beforeBalancePesewas,
        afterBalancePesewas,
        deltaPesewas: amountPesewas,
      };
    }
    case 'BALANCE_ADJUSTMENT': {
      const afterBalancePesewas = Math.max(beforeBalancePesewas - amountPesewas, 0);
      return {
        beforeBalancePesewas,
        afterBalancePesewas,
        deltaPesewas: afterBalancePesewas - beforeBalancePesewas,
      };
    }
    case 'WRITE_OFF':
      return {
        beforeBalancePesewas,
        afterBalancePesewas: 0,
        deltaPesewas: -beforeBalancePesewas,
      };
    default:
      throw new Error(`VALIDATION:Unsupported adjustment type ${type as string}.`);
  }
}
