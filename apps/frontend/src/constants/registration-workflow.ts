export const REGISTRATION_WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type RegistrationWorkflowStatus =
  (typeof REGISTRATION_WORKFLOW_STATUS)[keyof typeof REGISTRATION_WORKFLOW_STATUS];

export const REGISTRATION_WORKFLOW_STATUS_LABELS: Record<RegistrationWorkflowStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const REGISTRATION_DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: '', label: 'All time' },
] as const;

export type RegistrationDateFilter =
  (typeof REGISTRATION_DATE_FILTERS)[number]['value'];
