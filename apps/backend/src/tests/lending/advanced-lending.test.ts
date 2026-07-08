import { describe, expect, it } from 'vitest';
import { calculatePenaltyPesewas, waivePenaltyAmount } from '../../domain/loan/penalties.js';
import { scoreGuarantorEligibility } from '../../domain/guarantor/scoring.js';
import { getCadenceDayOffset } from '../../domain/loan/schedule-cadence.js';

describe('schedule cadence', () => {
  it('returns day offsets for supported cadences', () => {
    expect(getCadenceDayOffset('WEEKLY')).toBe(7);
    expect(getCadenceDayOffset('BIWEEKLY')).toBe(14);
    expect(getCadenceDayOffset('MONTHLY')).toBe(30);
  });
});

describe('penalty engine', () => {
  it('calculates flat penalties with a maximum cap', () => {
    const penalty = calculatePenaltyPesewas({
      missedWeeks: 4,
      installmentPesewas: 10_000,
      rule: { calculation: 'FLAT', amountPesewas: 500, maxAmountPesewas: 1_000 },
    });
    expect(penalty).toBe(1_000);
  });

  it('waives penalties down to zero', () => {
    expect(waivePenaltyAmount(2_000, 500)).toBe(1_500);
    expect(waivePenaltyAmount(300, 500)).toBe(0);
  });
});

describe('guarantor scoring', () => {
  it('rates high utilization as higher risk', () => {
    const score = scoreGuarantorEligibility({
      activeGuaranteeCount: 3,
      maxGuarantees: 3,
      borrowerDefaultCount: 1,
      outstandingGuaranteePesewas: 50_000,
      onTimeRepaymentRate: 0.6,
    });
    expect(score.riskRating).toBe('HIGH');
    expect(score.eligibilityScore).toBeLessThan(50);
  });
});
