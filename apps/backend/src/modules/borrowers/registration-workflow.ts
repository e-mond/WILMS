const BORROWER_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  BLACKLISTED: 'BLACKLISTED',
} as const;

export const REGISTRATION_WORKFLOW_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type RegistrationWorkflowStatus =
  (typeof REGISTRATION_WORKFLOW_STATUS)[keyof typeof REGISTRATION_WORKFLOW_STATUS];

function isWithinDays(isoDate: string, days: number): boolean {
  const registered = new Date(isoDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return registered >= cutoff;
}

export function resolveRegistrationWorkflowStatus(
  borrowerStatus: string,
  registeredAt: string,
): RegistrationWorkflowStatus {
  switch (borrowerStatus) {
    case BORROWER_STATUS.APPROVED:
      return REGISTRATION_WORKFLOW_STATUS.APPROVED;
    case BORROWER_STATUS.REJECTED:
    case BORROWER_STATUS.BLACKLISTED:
      return REGISTRATION_WORKFLOW_STATUS.REJECTED;
    case BORROWER_STATUS.PENDING:
      return isWithinDays(registeredAt, 1)
        ? REGISTRATION_WORKFLOW_STATUS.SUBMITTED
        : REGISTRATION_WORKFLOW_STATUS.UNDER_REVIEW;
    default:
      return REGISTRATION_WORKFLOW_STATUS.DRAFT;
  }
}

export function canEditRegistrationWorkflow(status: RegistrationWorkflowStatus): boolean {
  return (
    status === REGISTRATION_WORKFLOW_STATUS.DRAFT ||
    status === REGISTRATION_WORKFLOW_STATUS.SUBMITTED ||
    status === REGISTRATION_WORKFLOW_STATUS.UNDER_REVIEW
  );
}

export function canDeleteRegistrationWorkflow(status: RegistrationWorkflowStatus): boolean {
  return (
    status === REGISTRATION_WORKFLOW_STATUS.DRAFT ||
    status === REGISTRATION_WORKFLOW_STATUS.SUBMITTED
  );
}
