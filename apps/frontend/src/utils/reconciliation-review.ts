import type { ReconciliationSummary } from '@/types/services';

export function needsReconciliationReview(row: ReconciliationSummary): boolean {
  if (!row.submitted) {
    return false;
  }

  if (row.status === 'APPROVED' || row.status === 'REJECTED' || row.status === 'LOCKED') {
    return false;
  }

  return (
    row.varianceFlagged ||
    row.status === 'PENDING_REVIEW' ||
    row.status === 'UNDER_INVESTIGATION' ||
    row.status === 'REOPENED'
  );
}

export function summarizeReconciliationsForDate(
  rows: ReconciliationSummary[],
  date: string,
): {
  submittedCount: number;
  approvedCount: number;
  underReviewCount: number;
} {
  const submitted = rows.filter((row) => row.submitted && row.date === date);

  return {
    submittedCount: submitted.length,
    approvedCount: submitted.filter((row) => row.status === 'APPROVED').length,
    underReviewCount: submitted.filter(needsReconciliationReview).length,
  };
}
