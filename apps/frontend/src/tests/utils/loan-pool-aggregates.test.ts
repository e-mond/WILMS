import { describe, expect, it } from 'vitest';
import { derivePoolAggregates } from '@/utils/loan-pool-aggregates';

describe('derivePoolAggregates', () => {
  it('computes utilisation from disbursed capital', () => {
    const result = derivePoolAggregates({
      capitalPesewas: 1_000_000,
      totals: {
        disbursedPesewas: 250_000,
        collectedPesewas: 50_000,
        replenishmentPesewas: 1_000_000,
        adjustmentPesewas: 0,
      },
    });

    expect(result.utilisationPercent).toBe(25);
    expect(result.outstandingPesewas).toBe(200_000);
    expect(result.status).toBe('ACTIVE');
  });

  it('marks new pools as launching when utilisation is low', () => {
    const result = derivePoolAggregates({
      capitalPesewas: 1_000_000,
      totals: {
        disbursedPesewas: 0,
        collectedPesewas: 0,
        replenishmentPesewas: 1_000_000,
        adjustmentPesewas: 0,
      },
    });

    expect(result.utilisationPercent).toBe(0);
    expect(result.status).toBe('LAUNCHING');
  });
});
