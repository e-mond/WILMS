import type { TimelineStep } from '@/components/data-display/TimelineStepper';
import { LOAN_LIFECYCLE, type LoanLifecycleStatus, type LoanStatus } from '@/types/loan';

export type LoanWorkflowStepId =
  | 'registration_submitted'
  | 'registration_approved'
  | 'loan_created'
  | 'loan_approved'
  | 'admin_fee_paid'
  | 'pending_disbursement'
  | 'disbursed'
  | 'active'
  | 'closed';

function stepState(
  completedThrough: number,
  currentIndex: number,
  index: number,
): TimelineStep['state'] {
  if (index < completedThrough) return 'complete';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

/**
 * User-facing loan file stepper. Internal statuses (draft, written-off, defaulted)
 * are mapped to the nearest public step and are not shown as labels.
 */
export function buildLoanWorkflowSteps(input: {
  lifecycleStatus?: LoanLifecycleStatus | string;
  status: LoanStatus | string;
  adminFeePaid: boolean;
}): TimelineStep[] {
  const lifecycle = input.lifecycleStatus ?? inferLifecycleFromExternal(input.status);

  const labels: Array<{ id: LoanWorkflowStepId; label: string; detail?: string }> = [
    { id: 'registration_submitted', label: 'Registration Submitted' },
    { id: 'registration_approved', label: 'Registration Approved' },
    { id: 'loan_created', label: 'Loan Created' },
    { id: 'loan_approved', label: 'Loan Approved' },
    {
      id: 'admin_fee_paid',
      label: 'Admin Fee Paid',
      detail: input.adminFeePaid ? undefined : 'Required before disbursement.',
    },
    { id: 'pending_disbursement', label: 'Pending Disbursement' },
    { id: 'disbursed', label: 'Disbursed' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
  ];

  let currentIndex = 2;

  if (lifecycle === LOAN_LIFECYCLE.COMPLETED || lifecycle === LOAN_LIFECYCLE.WRITTEN_OFF) {
    currentIndex = 8;
  } else if (lifecycle === LOAN_LIFECYCLE.DEFAULTED) {
    currentIndex = 7;
  } else if (lifecycle === LOAN_LIFECYCLE.ACTIVE) {
    currentIndex = 7;
  } else if (lifecycle === LOAN_LIFECYCLE.DISBURSED) {
    currentIndex = 6;
  } else if (lifecycle === LOAN_LIFECYCLE.PENDING_DISBURSEMENT) {
    currentIndex = input.adminFeePaid ? 5 : 4;
  } else if (lifecycle === LOAN_LIFECYCLE.APPROVED) {
    currentIndex = input.adminFeePaid ? 5 : 4;
  } else if (
    lifecycle === LOAN_LIFECYCLE.PENDING_APPROVAL ||
    lifecycle === LOAN_LIFECYCLE.DRAFT ||
    lifecycle === LOAN_LIFECYCLE.REJECTED
  ) {
    currentIndex = 3;
  }

  const completedThrough =
    lifecycle === LOAN_LIFECYCLE.COMPLETED || lifecycle === LOAN_LIFECYCLE.WRITTEN_OFF
      ? 9
      : currentIndex;

  return labels.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    detail: entry.detail,
    state: stepState(completedThrough, currentIndex, index),
  }));
}

function inferLifecycleFromExternal(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return LOAN_LIFECYCLE.ACTIVE;
    case 'COMPLETED':
      return LOAN_LIFECYCLE.COMPLETED;
    case 'DEFAULTED':
      return LOAN_LIFECYCLE.DEFAULTED;
    case 'WRITTEN_OFF':
      return LOAN_LIFECYCLE.WRITTEN_OFF;
    case 'PENDING_DISBURSEMENT':
    default:
      return LOAN_LIFECYCLE.PENDING_APPROVAL;
  }
}

export function canApproveLoan(lifecycleStatus?: string): boolean {
  return (
    lifecycleStatus === LOAN_LIFECYCLE.PENDING_APPROVAL ||
    lifecycleStatus === LOAN_LIFECYCLE.DRAFT
  );
}

export function canDisburseLoan(lifecycleStatus?: string): boolean {
  return lifecycleStatus === LOAN_LIFECYCLE.PENDING_DISBURSEMENT;
}

export function workflowActionHint(input: {
  lifecycleStatus?: string;
  adminFeePaid: boolean;
  canDisburseEligibility?: boolean;
}): string | null {
  if (canDisburseLoan(input.lifecycleStatus)) {
    if (input.adminFeePaid === false || input.canDisburseEligibility === false) {
      return 'Admin fee must be recorded before this loan can be disbursed.';
    }
    return 'This loan is approved and ready to disburse.';
  }
  if (canApproveLoan(input.lifecycleStatus)) {
    return 'Approve this loan to move it to pending disbursement.';
  }
  return null;
}
