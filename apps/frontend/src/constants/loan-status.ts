import { LOAN_STATUS, type LoanStatus } from '@/types/loan';
import type { BadgeVariant } from '@/components/ui/Badge';

export interface LoanStatusDisplay {
  label: string;
  variant: BadgeVariant;
}

export const LOAN_STATUS_DISPLAY: Record<LoanStatus, LoanStatusDisplay> = {
  [LOAN_STATUS.PENDING_DISBURSEMENT]: {
    label: 'Pending disbursement',
    variant: 'pending',
  },
  [LOAN_STATUS.ACTIVE]: {
    label: 'Active',
    variant: 'success',
  },
  [LOAN_STATUS.COMPLETED]: {
    label: 'Completed',
    variant: 'primary',
  },
  [LOAN_STATUS.DEFAULTED]: {
    label: 'Defaulted',
    variant: 'danger',
  },
  [LOAN_STATUS.WRITTEN_OFF]: {
    label: 'Written off',
    variant: 'blacklisted',
  },
};

export const LOAN_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: LOAN_STATUS.ACTIVE, label: LOAN_STATUS_DISPLAY[LOAN_STATUS.ACTIVE].label },
  {
    value: LOAN_STATUS.PENDING_DISBURSEMENT,
    label: LOAN_STATUS_DISPLAY[LOAN_STATUS.PENDING_DISBURSEMENT].label,
  },
  { value: LOAN_STATUS.COMPLETED, label: LOAN_STATUS_DISPLAY[LOAN_STATUS.COMPLETED].label },
  { value: LOAN_STATUS.DEFAULTED, label: LOAN_STATUS_DISPLAY[LOAN_STATUS.DEFAULTED].label },
  { value: LOAN_STATUS.WRITTEN_OFF, label: LOAN_STATUS_DISPLAY[LOAN_STATUS.WRITTEN_OFF].label },
];
