export const RECONCILIATION_WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  UNDER_REVIEW: 'UNDER_REVIEW',
  RETURNED: 'RETURNED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
  LOCKED: 'LOCKED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type ReconciliationWorkflowStatus =
  (typeof RECONCILIATION_WORKFLOW_STATUS)[keyof typeof RECONCILIATION_WORKFLOW_STATUS];

export const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_REVIEW: 'Under review',
  UNDER_INVESTIGATION: 'Under investigation',
  UNDER_REVIEW: 'Under review',
  RETURNED: 'Returned',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REOPENED: 'Returned',
  LOCKED: 'Locked',
  ARCHIVED: 'Archived',
};

export const RECONCILIATION_REVIEW_OPTIONS: Array<{
  value: 'PENDING_REVIEW' | 'UNDER_INVESTIGATION' | 'APPROVED' | 'REJECTED' | 'REOPENED';
  label: string;
}> = [
  { value: 'PENDING_REVIEW', label: 'Under review' },
  { value: 'UNDER_INVESTIGATION', label: 'Under investigation' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REOPENED', label: 'Returned' },
];

export function reconciliationLifecycleLabel(status?: string, submitted?: boolean): string {
  if (!status && submitted) {
    return 'Submitted';
  }

  if (!status && !submitted) {
    return 'Draft';
  }

  if (status === 'APPROVED' && submitted) {
    return 'Approved';
  }

  return RECONCILIATION_STATUS_LABELS[status ?? 'SUBMITTED'] ?? status ?? 'Submitted';
}
