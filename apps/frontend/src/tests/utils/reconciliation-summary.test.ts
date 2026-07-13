import { describe, expect, it } from 'vitest';
import {
  buildReconciliationTotals,
  calculatePrimaryVariancePesewas,
  isVarianceAboveThreshold,
} from '@/utils/reconciliation-summary';

describe('reconciliation-summary utils', () => {
  const loans = [
    {
      id: 'loan-001',
      borrowerId: 'borrower-001',
      borrowerName: 'Ama Mensah',
      phone: '0240000001',
      community: 'Osu',
      groupName: 'Sunrise Women',
      weeklyPaymentPesewas: 5000,
      paymentDay: 'Friday',
      missedWeeks: 0,
    },
  ];

  const payments = [
    {
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      collectorId: 'user-collector',
      paymentDate: '2026-05-29',
    },
  ];

  it('builds expected and actual totals for due loans and recorded payments', () => {
    expect(buildReconciliationTotals('user-collector', '2026-05-29', loans, payments)).toEqual({
      expectedPesewas: 5000,
      actualPesewas: 5000,
    });
  });

  it('calculates zero primary variance when physical cash matches expected due', () => {
    expect(calculatePrimaryVariancePesewas(5000, 5000)).toBe(0);
  });

  it('calculates positive primary variance when physical cash exceeds expected due', () => {
    expect(calculatePrimaryVariancePesewas(5500, 5000)).toBe(500);
  });

  it('calculates negative primary variance when physical cash is below expected due', () => {
    expect(calculatePrimaryVariancePesewas(4500, 5000)).toBe(-500);
  });

  it('flags variance above the default threshold', () => {
    expect(isVarianceAboveThreshold(600, 5000)).toBe(true);
    expect(isVarianceAboveThreshold(400, 5000)).toBe(false);
  });

  it('does not flag variance when no collections were expected', () => {
    expect(isVarianceAboveThreshold(100, 0)).toBe(false);
    expect(isVarianceAboveThreshold(0, 0)).toBe(false);
  });
});
