import { BORROWER_STATUS } from '@/types/borrower';
import {
  REGISTRATION_WORKFLOW_STATUS,
  type RegistrationDateFilter,
  type RegistrationWorkflowStatus,
} from '@/constants/registration-workflow';
import type { OfficerRegistrationSummary } from '@/types/borrower';

export function resolveRegistrationWorkflowStatus(
  borrowerStatus: OfficerRegistrationSummary['status'],
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

export function canEditRegistration(status: RegistrationWorkflowStatus): boolean {
  return (
    status === REGISTRATION_WORKFLOW_STATUS.DRAFT ||
    status === REGISTRATION_WORKFLOW_STATUS.SUBMITTED ||
    status === REGISTRATION_WORKFLOW_STATUS.UNDER_REVIEW
  );
}

export function canDeleteRegistration(status: RegistrationWorkflowStatus): boolean {
  return (
    status === REGISTRATION_WORKFLOW_STATUS.DRAFT ||
    status === REGISTRATION_WORKFLOW_STATUS.SUBMITTED
  );
}

function isWithinDays(isoDate: string, days: number): boolean {
  const registered = new Date(isoDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return registered >= cutoff;
}

export function matchesRegistrationDateFilter(
  registeredAt: string,
  filter: RegistrationDateFilter,
): boolean {
  if (!filter) {
    return true;
  }

  const registered = new Date(registeredAt);
  const now = new Date();

  switch (filter) {
    case 'today':
      return registered.toDateString() === now.toDateString();
    case 'week': {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return registered >= weekAgo;
    }
    case 'month': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      return registered >= monthAgo;
    }
    case 'year': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(now.getFullYear() - 1);
      return registered >= yearAgo;
    }
    default:
      return true;
  }
}

export function countRegistrationsByStatus(
  registrations: OfficerRegistrationSummary[],
): Record<RegistrationWorkflowStatus, number> {
  return registrations.reduce(
    (counts, registration) => {
      counts[registration.registrationStatus] += 1;
      return counts;
    },
    {
      [REGISTRATION_WORKFLOW_STATUS.DRAFT]: 0,
      [REGISTRATION_WORKFLOW_STATUS.SUBMITTED]: 0,
      [REGISTRATION_WORKFLOW_STATUS.UNDER_REVIEW]: 0,
      [REGISTRATION_WORKFLOW_STATUS.APPROVED]: 0,
      [REGISTRATION_WORKFLOW_STATUS.REJECTED]: 0,
    },
  );
}
