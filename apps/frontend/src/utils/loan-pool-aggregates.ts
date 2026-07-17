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
  if (utilisationPercent >= 95) {
    status = 'NEAR_FULL';
  } else if (utilisationPercent < 20) {
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
