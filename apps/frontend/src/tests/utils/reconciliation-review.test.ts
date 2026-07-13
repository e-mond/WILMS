import { describe, expect, it } from 'vitest';
import {
  needsReconciliationReview,
  summarizeReconciliationsForDate,
} from '@/utils/reconciliation-review';
import type { ReconciliationSummary } from '@/types/services';

describe('reconciliation-review utils', () => {
  const rows: ReconciliationSummary[] = [
    {
      collectorId: 'collector-1',
      date: '2026-07-13',
      expectedPesewas: 10000,
      actualPesewas: 10000,
      variancePesewas: 0,
      submitted: true,
      status: 'APPROVED',
    },
    {
      collectorId: 'collector-2',
      date: '2026-07-13',
      expectedPesewas: 8000,
      actualPesewas: 5000,
      variancePesewas: -3000,
      varianceFlagged: true,
      submitted: true,
      status: 'PENDING_REVIEW',
    },
    {
      collectorId: 'collector-3',
      date: '2026-07-12',
      expectedPesewas: 4000,
      actualPesewas: 4000,
      variancePesewas: 0,
      submitted: true,
      status: 'APPROVED',
    },
  ];

  it('identifies reconciliations that still need review', () => {
    expect(needsReconciliationReview(rows[0]!)).toBe(false);
    expect(needsReconciliationReview(rows[1]!)).toBe(true);
  });

  it('summarizes reconciliations for a report date', () => {
    expect(summarizeReconciliationsForDate(rows, '2026-07-13')).toEqual({
      submittedCount: 2,
      approvedCount: 1,
      underReviewCount: 1,
    });
  });
});
