import { BORROWER_STATUS, type BorrowerStatus } from '@wilms/shared-contracts';
import type { BorrowerRecord } from '../../db/store.js';

export interface BorrowerRiskSummary {
  riskRating: string;
  missedPaymentCount: number;
  defaultStatus: string;
  blacklistStatus: string;
  flags: string[];
  notes: string[];
}

interface LoanSummaryInput {
  status: string;
}

interface ProgressInput {
  totalMissed?: number;
}

export function buildBorrowerRiskSummary(
  record: BorrowerRecord,
  loans: LoanSummaryInput[],
  progress?: ProgressInput | null,
): BorrowerRiskSummary {
  const activeDefault = loans.some((loan) => loan.status === 'DEFAULTED');
  const missedPayments = progress?.totalMissed ?? 0;
  const status = record.status as BorrowerStatus;

  let riskRating = 'Low Risk';

  if (status === BORROWER_STATUS.BLACKLISTED) {
    riskRating = 'Blacklisted';
  } else if (status === BORROWER_STATUS.DEFAULTED || activeDefault) {
    riskRating = 'Defaulted';
  } else if (status === BORROWER_STATUS.AT_RISK || missedPayments >= 2) {
    riskRating = 'At Risk';
  }

  return {
    riskRating,
    missedPaymentCount: missedPayments,
    defaultStatus: activeDefault || status === BORROWER_STATUS.DEFAULTED ? 'Yes' : 'No',
    blacklistStatus: status === BORROWER_STATUS.BLACKLISTED ? 'Blacklisted' : 'Clear',
    flags:
      missedPayments >= 2
        ? ['Missed payment pattern']
        : status === BORROWER_STATUS.AT_RISK
          ? ['Payment consistency below threshold']
          : [],
    notes:
      status === BORROWER_STATUS.BLACKLISTED
        ? ['Borrower is blacklisted and cannot receive new loans.']
        : [],
  };
}
