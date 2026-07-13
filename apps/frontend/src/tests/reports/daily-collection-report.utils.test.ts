import { describe, expect, it } from 'vitest';
import { LOAN_STATUS } from '@/types/loan';
import { TRANSACTION_TYPE } from '@/types/transaction';
import {
  buildDailyCollectionReport,
  extractRepaymentsFromTransactions,
  normalizeDailyCollectionReport,
} from '@/utils/daily-collection-report';

describe('daily-collection-report.utils', () => {
  it('extracts repayments for a specific date from the ledger', () => {
    const repayments = extractRepaymentsFromTransactions(
      [
        {
          id: 'txn-1',
          type: TRANSACTION_TYPE.REPAYMENT,
          borrowerId: 'borrower-001',
          loanId: 'loan-001',
          amountPesewas: 5000,
          collectorId: 'user-collector',
          recordedAt: '2026-05-23T14:30:00.000Z',
        },
        {
          id: 'txn-2',
          type: TRANSACTION_TYPE.REPAYMENT,
          borrowerId: 'borrower-001',
          loanId: 'loan-001',
          amountPesewas: 5000,
          collectorId: 'user-collector',
          recordedAt: '2026-05-16T14:30:00.000Z',
        },
      ],
      '2026-05-23',
    );

    expect(repayments).toHaveLength(1);
    expect(repayments[0]?.amountPesewas).toBe(5000);
  });

  it('builds expected vs collected summary and pending due rows', () => {
    const report = buildDailyCollectionReport({
      date: '2026-05-22',
      loans: [
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
      ],
      repayments: [],
    });

    expect(report.summary).toMatchObject({
      date: '2026-05-22',
      paymentDayLabel: 'Friday',
      borrowersDueCount: 1,
      borrowersPaidCount: 0,
      expectedPesewas: 5000,
      collectedPesewas: 0,
      variancePesewas: -5000,
    });
    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]).toMatchObject({
      borrowerName: 'Ama Mensah',
      collectedPesewas: 0,
      expectedPesewas: 5000,
    });
  });

  it('marks due borrowers as paid when full repayment is recorded', () => {
    const report = buildDailyCollectionReport({
      date: '2026-05-23',
      loans: [
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
      ],
      repayments: [
        {
          id: 'txn-1',
          borrowerId: 'borrower-001',
          loanId: 'loan-001',
          amountPesewas: 5000,
          collectorId: 'user-collector',
          recordedAt: '2026-05-23T14:30:00.000Z',
        },
      ],
    });

    expect(report.summary.collectedPesewas).toBe(5000);
    expect(report.summary.borrowersDueCount).toBe(0);
    expect(report.rows[0]?.collectorName).toBe('COL-000');
  });

  it('recomputes variance when normalizing API payloads with summary', () => {
    const normalized = normalizeDailyCollectionReport(
      {
        summary: {
          date: '2026-05-23',
          paymentDayLabel: 'Saturday',
          borrowersDueCount: 0,
          borrowersPaidCount: 1,
          expectedPesewas: 0,
          collectedPesewas: 5000,
          variancePesewas: 0,
          collectorsActiveCount: 1,
        },
        rows: [],
      },
      '2026-05-23',
    );

    expect(normalized.summary.variancePesewas).toBe(5000);
  });
});
