import { describe, expect, it } from 'vitest';
import { mapReconciliationRowToSummary, mapSnapshotToSummary } from '../../domain/reconciliation/mappers.js';

describe('reconciliation repository mapping', () => {
  it('maps persisted row to summary contract', () => {
    const summary = mapReconciliationRowToSummary({
      collectorUserId: 'collector-1',
      reconciliationDate: '2026-06-02',
      expectedDuePesewas: 10000,
      systemRecordedPesewas: 9000,
      physicalCashPesewas: 8500,
      primaryVariancePesewas: -1500,
      varianceFlagged: true,
      submittedAt: new Date('2026-06-02T18:00:00.000Z'),
    });

    expect(summary.collectorId).toBe('collector-1');
    expect(summary.actualPesewas).toBe(9000);
    expect(summary.variancePesewas).toBe(-1500);
    expect(summary.submitted).toBe(true);
  });
});
