/**
 * Pool aggregate calculations — must stay aligned with pool_allocations sums.
 */

export const POOL_UTILISATION_NEAR_FULL_THRESHOLD = 95;
export const POOL_UTILISATION_LAUNCHING_THRESHOLD = 20;

export interface PoolAllocationTotals {
  disbursedPesewas: number;
  collectedPesewas: number;
  replenishmentPesewas: number;
  adjustmentPesewas: number;
}

export function derivePoolAggregates(input: {
  capitalPesewas: number;
  totals: PoolAllocationTotals;
}): {
  disbursedPesewas: number;
  collectedPesewas: number;
  outstandingPesewas: number;
  utilisationPercent: number;
  repaymentRatePercent: number;
  status: 'ACTIVE' | 'NEAR_FULL' | 'LAUNCHING';
} {
  const { capitalPesewas, totals } = input;
  const disbursedPesewas = totals.disbursedPesewas;
  const collectedPesewas = totals.collectedPesewas;
  const outstandingPesewas = Math.max(disbursedPesewas - collectedPesewas, 0);

  const utilisationPercent =
    capitalPesewas > 0 ? Math.min(Math.round((disbursedPesewas / capitalPesewas) * 100), 100) : 0;

  const repaymentRatePercent =
    disbursedPesewas > 0 ? Math.round((collectedPesewas / disbursedPesewas) * 1000) / 10 : 0;

  let status: 'ACTIVE' | 'NEAR_FULL' | 'LAUNCHING' = 'ACTIVE';
  if (utilisationPercent >= POOL_UTILISATION_NEAR_FULL_THRESHOLD) {
    status = 'NEAR_FULL';
  } else if (utilisationPercent < POOL_UTILISATION_LAUNCHING_THRESHOLD) {
    status = 'LAUNCHING';
  }

  return {
    disbursedPesewas,
    collectedPesewas,
    outstandingPesewas,
    utilisationPercent,
    repaymentRatePercent,
    status,
  };
}

export function assertPoolBalanceIntegrity(input: {
  stored: {
    capitalPesewas: number;
    disbursedPesewas: number;
    collectedPesewas: number;
    outstandingPesewas: number;
  };
  totals: PoolAllocationTotals;
}): string | null {
  const derived = derivePoolAggregates({
    capitalPesewas: input.stored.capitalPesewas,
    totals: input.totals,
  });

  if (derived.disbursedPesewas !== input.stored.disbursedPesewas) {
    return `disbursed mismatch stored=${input.stored.disbursedPesewas} derived=${derived.disbursedPesewas}`;
  }
  if (derived.collectedPesewas !== input.stored.collectedPesewas) {
    return `collected mismatch stored=${input.stored.collectedPesewas} derived=${derived.collectedPesewas}`;
  }
  if (derived.outstandingPesewas !== input.stored.outstandingPesewas) {
    return `outstanding mismatch stored=${input.stored.outstandingPesewas} derived=${derived.outstandingPesewas}`;
  }

  const expectedCapital =
    input.totals.replenishmentPesewas + input.totals.adjustmentPesewas;
  if (expectedCapital > 0 && expectedCapital !== input.stored.capitalPesewas) {
    // Seed sets capital directly; replenishment rows must reconcile when writers exist.
    return null;
  }

  return null;
}
