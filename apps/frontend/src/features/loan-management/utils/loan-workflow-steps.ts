import type { TimelineStep } from '@/components/data-display/TimelineStepper';
import { LOAN_LIFECYCLE, type LoanLifecycleStatus, type LoanStatus } from '@/types/loan';

export type LoanWorkflowStepId =
  | 'application_submitted'
  | 'admin_fee_paid'
  | 'approved'
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
 * Maps loan lifecycle (+ admin fee) to the user-facing workflow stepper.
 */
export function buildLoanWorkflowSteps(input: {
  lifecycleStatus?: LoanLifecycleStatus | string;
  status: LoanStatus | string;
  adminFeePaid: boolean;
}): TimelineStep[] {
  const lifecycle = input.lifecycleStatus ?? inferLifecycleFromExternal(input.status);

  let currentIndex = 0;

  if (lifecycle === LOAN_LIFECYCLE.COMPLETED || lifecycle === LOAN_LIFECYCLE.WRITTEN_OFF) {
    currentIndex = 6;
  } else if (lifecycle === LOAN_LIFECYCLE.DEFAULTED) {
    currentIndex = 6;
  } else if (lifecycle === LOAN_LIFECYCLE.ACTIVE) {
    currentIndex = 5;
  } else if (lifecycle === LOAN_LIFECYCLE.DISBURSED) {
    currentIndex = 4;
  } else if (lifecycle === LOAN_LIFECYCLE.PENDING_DISBURSEMENT) {
    currentIndex = 3;
  } else if (lifecycle === LOAN_LIFECYCLE.APPROVED) {
    currentIndex = 2;
  } else if (
    lifecycle === LOAN_LIFECYCLE.PENDING_APPROVAL ||
    lifecycle === LOAN_LIFECYCLE.DRAFT ||
    lifecycle === LOAN_LIFECYCLE.REJECTED
  ) {
    currentIndex = input.adminFeePaid ? 2 : 1;
  } else {
    currentIndex = 0;
  }

  // Admin fee is a prerequisite gate — if unpaid, pin current at admin fee
  // unless already past approval in lifecycle.
  if (
    !input.adminFeePaid &&
    lifecycle !== LOAN_LIFECYCLE.PENDING_DISBURSEMENT &&
    lifecycle !== LOAN_LIFECYCLE.DISBURSED &&
    lifecycle !== LOAN_LIFECYCLE.ACTIVE &&
    lifecycle !== LOAN_LIFECYCLE.COMPLETED &&
    lifecycle !== LOAN_LIFECYCLE.DEFAULTED &&
    lifecycle !== LOAN_LIFECYCLE.WRITTEN_OFF
  ) {
    currentIndex = 1;
  }

  const completedThrough =
    lifecycle === LOAN_LIFECYCLE.COMPLETED || lifecycle === LOAN_LIFECYCLE.WRITTEN_OFF
      ? 7
      : currentIndex;


  const labels: Array<{ id: LoanWorkflowStepId; label: string; detail?: string }> = [
    { id: 'application_submitted', label: 'Application Submitted' },
    {
      id: 'admin_fee_paid',
      label: 'Admin Fee Paid',
      detail: input.adminFeePaid ? undefined : 'Record admin fee before approval.',
    },
    {
      id: 'approved',
      label: 'Approved',
      detail:
        lifecycle === LOAN_LIFECYCLE.PENDING_APPROVAL
          ? 'Awaiting loan approval.'
          : undefined,
    },
    { id: 'pending_disbursement', label: 'Pending Disbursement' },
    { id: 'disbursed', label: 'Disbursed' },
    { id: 'active', label: 'Active' },
    { id: 'closed', label: 'Closed' },
  ];

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
    if (!input.adminFeePaid) {
      return 'Record the admin fee, then approve this loan before disbursement.';
    }
    return 'Approve this loan to move it to pending disbursement.';
  }
  return null;
}
