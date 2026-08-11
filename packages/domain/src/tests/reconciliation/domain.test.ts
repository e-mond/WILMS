import { describe, expect, it } from 'vitest';
import {
  calculateExpectedDuePesewas,
  calculateSystemRecordedPesewas,
} from '../../domain/reconciliation/expected-cash.js';
import { buildReconciliationSnapshot } from '../../domain/reconciliation/snapshot.js';
import {
  calculatePrimaryVariancePesewas,
  calculateVariancePercentage,
  classifyVariance,
  isVarianceFlagged,
} from '../../domain/reconciliation/variance.js';
import { RECONCILIATION_VARIANCE_CLASS } from '../../domain/reconciliation/types.js';

describe('expected-cash', () => {
  it('sums weekly payments for loans due on reconciliation date', () => {
    const total = calculateExpectedDuePesewas(
      [
        { paymentDay: 'Monday', weeklyPaymentPesewas: 5000 },
        { paymentDay: 'Tuesday', weeklyPaymentPesewas: 7000 },
      ],
      '2026-06-01',
    );

    expect(total).toBe(5000);
  });

  it('prefers schedule dues and avoids double-counting payment-day loans', () => {
    const total = calculateExpectedDuePesewas(
      [
        { id: 'loan-1', paymentDay: 'Monday', weeklyPaymentPesewas: 5000 },
        { id: 'loan-2', paymentDay: 'Wednesday', weeklyPaymentPesewas: 8000 },
      ],
      '2026-06-03', // Wednesday
      [
        { loanId: 'loan-1', installmentPesewas: 5000 }, // holiday-shifted Monday loan
      ],
    );

    // Schedule due for loan-1 + payment-day due for loan-2
    expect(total).toBe(13000);
  });

  it('excludes REVERSED payments from system recorded', () => {
    const total = calculateSystemRecordedPesewas([
      { amountPesewas: 5000, status: 'CONFIRMED' },
      { amountPesewas: 3000, status: 'REVERSED' },
    ]);

    expect(total).toBe(5000);
  });
});

describe('variance', () => {
  it('classifies balanced, shortage, and overage', () => {
    expect(classifyVariance(0)).toBe(RECONCILIATION_VARIANCE_CLASS.BALANCED);
    expect(classifyVariance(-100)).toBe(RECONCILIATION_VARIANCE_CLASS.SHORTAGE);
    expect(classifyVariance(100)).toBe(RECONCILIATION_VARIANCE_CLASS.OVERAGE);
  });

  it('flags variance above threshold and never auto-approves zero-expected cash', () => {
    expect(isVarianceFlagged(-25, 200, 10)).toBe(true);
    expect(isVarianceFlagged(500, 0, 10)).toBe(true);
    expect(isVarianceFlagged(0, 200, 10, 50)).toBe(true);
    expect(calculateVariancePercentage(-25, 200)).toBe(12.5);
    expect(calculatePrimaryVariancePesewas(175, 200)).toBe(-25);
  });
});

describe('snapshot', () => {
  it('builds immutable reconciliation snapshot', () => {
    const snapshot = buildReconciliationSnapshot({
      collectorUserId: 'collector-1',
      reconciliationDate: '2026-06-01',
      physicalCashPesewas: 15000,
      dueLoans: [{ paymentDay: 'Monday', weeklyPaymentPesewas: 15000 }],
      payments: [{ amountPesewas: 15000, status: 'CONFIRMED' }],
      thresholdPercent: 10,
      comment: null,
      submittedAt: new Date('2026-06-01T18:00:00.000Z'),
    });

    expect(snapshot.expectedDuePesewas).toBe(15000);
    expect(snapshot.systemRecordedPesewas).toBe(15000);
    expect(snapshot.primaryVariancePesewas).toBe(0);
    expect(snapshot.varianceClass).toBe(RECONCILIATION_VARIANCE_CLASS.BALANCED);
    expect(snapshot.varianceFlagged).toBe(false);
  });

  it('allows balanced submit when only admin fees were recorded (no loan payments)', () => {
    const snapshot = buildReconciliationSnapshot({
      collectorUserId: 'collector-1',
      reconciliationDate: '2026-06-02',
      physicalCashPesewas: 5000,
      dueLoans: [],
      payments: [],
      adminFeePesewas: 5000,
      thresholdPercent: 10,
      comment: null,
      submittedAt: new Date('2026-06-02T18:00:00.000Z'),
    });

    expect(snapshot.expectedDuePesewas).toBe(5000);
    expect(snapshot.systemRecordedPesewas).toBe(5000);
    expect(snapshot.primaryVariancePesewas).toBe(0);
    expect(snapshot.collectionDeltaPesewas).toBe(0);
    expect(snapshot.varianceFlagged).toBe(false);
    expect(snapshot.status).toBe('APPROVED');
  });
});
