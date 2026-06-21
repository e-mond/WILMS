export const LOAN_LIFECYCLE = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  PENDING_DISBURSEMENT: 'PENDING_DISBURSEMENT',
  DISBURSED: 'DISBURSED',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DEFAULTED: 'DEFAULTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;

export type LoanLifecycleStatus = (typeof LOAN_LIFECYCLE)[keyof typeof LOAN_LIFECYCLE];

export const LOAN_EXTERNAL_STATUS = {
  PENDING_DISBURSEMENT: 'PENDING_DISBURSEMENT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DEFAULTED: 'DEFAULTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;

export type LoanExternalStatus =
  (typeof LOAN_EXTERNAL_STATUS)[keyof typeof LOAN_EXTERNAL_STATUS];

const TRANSITIONS: Record<LoanLifecycleStatus, LoanLifecycleStatus[]> = {
  DRAFT: ['PENDING_APPROVAL'],
  PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
  APPROVED: ['PENDING_DISBURSEMENT'],
  REJECTED: [],
  PENDING_DISBURSEMENT: ['DISBURSED'],
  DISBURSED: ['ACTIVE'],
  ACTIVE: ['COMPLETED', 'DEFAULTED', 'WRITTEN_OFF'],
  COMPLETED: ['ACTIVE'],
  DEFAULTED: ['ACTIVE', 'WRITTEN_OFF'],
  WRITTEN_OFF: [],
};

export function toExternalStatus(lifecycle: LoanLifecycleStatus): LoanExternalStatus {
  switch (lifecycle) {
    case LOAN_LIFECYCLE.DRAFT:
    case LOAN_LIFECYCLE.PENDING_APPROVAL:
    case LOAN_LIFECYCLE.APPROVED:
    case LOAN_LIFECYCLE.PENDING_DISBURSEMENT:
      return LOAN_EXTERNAL_STATUS.PENDING_DISBURSEMENT;
    case LOAN_LIFECYCLE.DISBURSED:
    case LOAN_LIFECYCLE.ACTIVE:
      return LOAN_EXTERNAL_STATUS.ACTIVE;
    case LOAN_LIFECYCLE.COMPLETED:
      return LOAN_EXTERNAL_STATUS.COMPLETED;
    case LOAN_LIFECYCLE.DEFAULTED:
      return LOAN_EXTERNAL_STATUS.DEFAULTED;
    case LOAN_LIFECYCLE.REJECTED:
    case LOAN_LIFECYCLE.WRITTEN_OFF:
      return LOAN_EXTERNAL_STATUS.WRITTEN_OFF;
    default:
      return LOAN_EXTERNAL_STATUS.PENDING_DISBURSEMENT;
  }
}

export function assertLifecycleTransition(
  current: LoanLifecycleStatus,
  next: LoanLifecycleStatus,
): void {
  if (!TRANSITIONS[current].includes(next)) {
    throw new Error(`VALIDATION:Invalid lifecycle transition ${current} → ${next}.`);
  }
}
