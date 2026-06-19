import { BORROWER_STATUS, type BorrowerSummary } from '@/types/borrower';

export interface BorrowerListSummary {
  totalBorrowers: number;
  approvedBorrowers: number;
  pendingBorrowers: number;
  blacklistedBorrowers: number;
}

export function summarizeBorrowerList(borrowers: BorrowerSummary[]): BorrowerListSummary {
  return borrowers.reduce(
    (summary, borrower) => {
      summary.totalBorrowers += 1;

      if (borrower.status === BORROWER_STATUS.APPROVED) {
        summary.approvedBorrowers += 1;
      } else if (borrower.status === BORROWER_STATUS.PENDING) {
        summary.pendingBorrowers += 1;
      } else if (borrower.status === BORROWER_STATUS.BLACKLISTED) {
        summary.blacklistedBorrowers += 1;
      }

      return summary;
    },
    {
      totalBorrowers: 0,
      approvedBorrowers: 0,
      pendingBorrowers: 0,
      blacklistedBorrowers: 0,
    },
  );
}
