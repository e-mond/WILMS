import { describe, expect, it } from 'vitest';
import { LOAN_STATUS } from '@/types/loan';
import { buildLoanPortfolioReport } from '@/utils/loan-portfolio-report';

describe('loan-portfolio-report.utils', () => {
  it('filters entries and summarizes totals for the report', () => {
    const report = buildLoanPortfolioReport(
      [
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
          id: 'loan-completed-001',
          borrowerId: 'borrower-003',
          borrowerName: 'Completed Borrower',
          community: 'Osu',
          groupName: 'Hope Circle',
          amountPesewas: 24000,
          outstandingPesewas: 0,
          weeklyPaymentPesewas: 3000,
          durationWeeks: 8,
          status: LOAN_STATUS.COMPLETED,
          cycleBatch: 'Cycle 4 — October 2025',
          paymentDay: 'Thursday',
          startDate: '2025-11-01',
        },
      ],
      { status: LOAN_STATUS.ACTIVE },
    );

    expect(report.entries).toHaveLength(1);
    expect(report.summary).toMatchObject({
      totalLoans: 1,
      activeLoans: 1,
      totalDisbursedPesewas: 50000,
      totalOutstandingPesewas: 35000,
    });
    expect(report.generatedAt).toBeTruthy();
  });
});
