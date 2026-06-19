import { BORROWER_STATUS, type BorrowerStatus } from '@/types/borrower';

export type BorrowerStatusBadgeVariant =
  | 'pending'
  | 'success'
  | 'warning'
  | 'danger'
  | 'blacklisted';

export interface BorrowerStatusDisplay {
  label: string;
  variant: BorrowerStatusBadgeVariant;
}

export const BORROWER_STATUS_DISPLAY: Record<BorrowerStatus, BorrowerStatusDisplay> = {
  [BORROWER_STATUS.PENDING]: {
    label: 'Pending',
    variant: 'pending',
  },
  [BORROWER_STATUS.APPROVED]: {
    label: 'Active',
    variant: 'success',
  },
  [BORROWER_STATUS.AT_RISK]: {
    label: 'At Risk',
    variant: 'warning',
  },
  [BORROWER_STATUS.DEFAULTED]: {
    label: 'Defaulted',
    variant: 'danger',
  },
  [BORROWER_STATUS.REJECTED]: {
    label: 'Rejected',
    variant: 'danger',
  },
  [BORROWER_STATUS.BLACKLISTED]: {
    label: 'Blacklisted',
    variant: 'blacklisted',
  },
};

export const BORROWER_REPAYMENT_ACTIVE_STATUSES = [
  BORROWER_STATUS.APPROVED,
  BORROWER_STATUS.AT_RISK,
  BORROWER_STATUS.DEFAULTED,
] as const satisfies readonly BorrowerStatus[];

export function isBorrowerRepaymentActive(status: BorrowerStatus): boolean {
  return (BORROWER_REPAYMENT_ACTIVE_STATUSES as readonly BorrowerStatus[]).includes(status);
}

export const BORROWER_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.values(BORROWER_STATUS).map((status) => ({
    value: status,
    label: BORROWER_STATUS_DISPLAY[status].label,
  })),
];
