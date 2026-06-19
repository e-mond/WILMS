import { describe, expect, it } from 'vitest';
import { LOAN_STATUS } from '@/types/loan';
import type { LoanPortfolioEntry } from '@/types/loan';
import {
  filterPortfolioEntries,
  summarizePortfolioEntries,
} from '@/utils/portfolio';

const SAMPLE_ENTRIES: LoanPortfolioEntry[] = [
  {
    id: 'loan-001',
    borrowerId: 'borrower-001',
    borrowerName: 'Ama Mensah',
    community: 'Madina',
    groupName: 'Sunrise Women',
    amountPesewas: 50000,
    outstandingPesewas: 35000,
    weeklyPaymentPesewas: 5000,
    durationWeeks: 10,
    status: LOAN_STATUS.ACTIVE,
    cycleBatch: 'Cycle 1 — January 2026',
    paymentDay: 'Friday',
    startDate: '2026-05-01',
  },
  {
    id: 'loan-pending-001',
    borrowerId: 'borrower-002',
    borrowerName: 'Efua Boateng',
    community: 'Madina',
    groupName: 'Sunrise Women',
    amountPesewas: 30000,
    outstandingPesewas: 30000,
    weeklyPaymentPesewas: 2500,
    durationWeeks: 12,
    status: LOAN_STATUS.PENDING_DISBURSEMENT,
    cycleBatch: 'Cycle 2 — April 2026',
    paymentDay: 'Monday',
    startDate: '2026-06-10',
  },
];

describe('portfolio.utils', () => {
  it('filters loans by status and search query', () => {
    const filtered = filterPortfolioEntries(SAMPLE_ENTRIES, {
      searchQuery: 'Efua',
      statusFilter: LOAN_STATUS.PENDING_DISBURSEMENT,
      cycleBatchFilter: '',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('loan-pending-001');
  });

  it('summarizes outstanding balances for visible loans', () => {
    const summary = summarizePortfolioEntries(SAMPLE_ENTRIES);

    expect(summary).toEqual({
      totalLoans: 2,
      activeLoans: 1,
      totalDisbursedPesewas: 80000,
      totalOutstandingPesewas: 65000,
    });
  });
});
