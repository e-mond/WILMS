export const RECONCILIATION_WORKFLOW_STATUS = {
  SUBMITTED: 'SUBMITTED',
  PENDING_REVIEW: 'PENDING_REVIEW',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
} as const;

export type ReconciliationWorkflowStatus =
  (typeof RECONCILIATION_WORKFLOW_STATUS)[keyof typeof RECONCILIATION_WORKFLOW_STATUS];

export const RECONCILIATION_STATUS_LABELS: Record<ReconciliationWorkflowStatus, string> = {
  SUBMITTED: 'Submitted',
  PENDING_REVIEW: 'Pending review',
  UNDER_INVESTIGATION: 'Under investigation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  REOPENED: 'Reopened',
};

export const RECONCILIATION_REVIEW_OPTIONS: Array<{
  value: ReconciliationWorkflowStatus;
  label: string;
}> = [
  { value: 'PENDING_REVIEW', label: 'Pending review' },
  { value: 'UNDER_INVESTIGATION', label: 'Under investigation' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'REOPENED', label: 'Reopened' },
];
