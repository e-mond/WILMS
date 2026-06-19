import { describe, expect, it } from 'vitest';
import { DEMO_OPERATING_POOL_PESEWAS } from '@/constants/dashboard';
import { BORROWER_STATUS } from '@/types/borrower';
import { LOAN_STATUS } from '@/types/loan';
import { SCHEDULE_WEEK_STATUS } from '@/types/loan-schedule';
import { TRANSACTION_TYPE } from '@/types/transaction';
import {
  buildBorrowerSegments,
  buildCollectorPerformanceRows,
  buildDashboardSummary,
  buildGroupRiskSegments,
  buildRecentAlerts,
} from '@/utils/dashboard-summary';

describe('dashboard-summary.utils', () => {
  it('builds borrower segments from repayment status', () => {
    const segments = buildBorrowerSegments(
      [
        { id: 'b1', status: BORROWER_STATUS.APPROVED },
        { id: 'b2', status: BORROWER_STATUS.BLACKLISTED },
      ],
      [
        {
          id: 'loan-1',
          borrowerId: 'b1',
          borrowerName: 'Ama',
          status: LOAN_STATUS.ACTIVE,
          amountPesewas: 100_000,
          outstandingPesewas: 50_000,
          weeklyPaymentPesewas: 5000,
          paymentDay: 'Friday',
          startDate: '2026-05-01',
          community: 'Madina',
          groupName: 'Sunrise Women',
          durationWeeks: 20,
          cycleBatch: '2026-Q2',
        },
      ],
      {
        'loan-1': [
          { weekNumber: 1, dueDate: '2026-05-09', status: SCHEDULE_WEEK_STATUS.PAID, amountPesewas: 5000 },
          { weekNumber: 2, dueDate: '2026-05-16', status: SCHEDULE_WEEK_STATUS.MISSED, amountPesewas: 5000 },
        ],
      },
    );

    expect(segments.find((segment) => segment.id === 'active')?.count).toBe(0);
    expect(segments.find((segment) => segment.id === 'atRisk')?.count).toBe(1);
    expect(segments.find((segment) => segment.id === 'blacklisted')?.count).toBe(1);
  });

  it('includes pending borrowers as a dedicated segment', () => {
    const segments = buildBorrowerSegments(
      [
        { id: 'pending-1', status: BORROWER_STATUS.PENDING },
        { id: 'pending-2', status: BORROWER_STATUS.PENDING },
      ],
      [],
      {},
    );

    expect(segments.find((segment) => segment.id === 'pending')).toMatchObject({
      label: 'Pending',
      count: 2,
      tone: 'pending',
    });
  });

  it('builds group risk distribution percentages', () => {
    const segments = buildGroupRiskSegments([
      { groupName: 'A', riskLevel: 'LOW_RISK' },
      { groupName: 'B', riskLevel: 'LOW_RISK' },
      { groupName: 'C', riskLevel: 'AT_RISK' },
      { groupName: 'D', riskLevel: 'SUSPENDED' },
    ]);

    expect(segments).toHaveLength(4);
    expect(segments.reduce((total, segment) => total + segment.percent, 0)).toBe(100);
  });

  it('builds collector performance from repayments', () => {
    const rows = buildCollectorPerformanceRows(
      [
        {
          id: 'loan-1',
          borrowerId: 'b1',
          borrowerName: 'Ama',
          status: LOAN_STATUS.ACTIVE,
          amountPesewas: 100_000,
          outstandingPesewas: 50_000,
          weeklyPaymentPesewas: 5000,
          paymentDay: 'Friday',
          startDate: '2026-05-01',
          community: 'Madina',
          groupName: 'Sunrise Women',
          durationWeeks: 20,
          cycleBatch: '2026-Q2',
        },
        {
          id: 'loan-2',
          borrowerId: 'b2',
          borrowerName: 'Efua',
          status: LOAN_STATUS.ACTIVE,
          amountPesewas: 80_000,
          outstandingPesewas: 40_000,
          weeklyPaymentPesewas: 3000,
          paymentDay: 'Monday',
          startDate: '2026-05-01',
          community: 'Osu',
          groupName: 'Hope Circle',
          durationWeeks: 20,
          cycleBatch: '2026-Q2',
        },
      ],
      [
        {
          id: 'tx-disburse-1',
          type: TRANSACTION_TYPE.DISBURSEMENT,
          amountPesewas: 100_000,
          borrowerId: 'b1',
          loanId: 'loan-1',
          collectorId: 'user-collector',
          recordedAt: '2026-05-01T10:00:00.000Z',
        },
        {
          id: 'tx-disburse-2',
          type: TRANSACTION_TYPE.DISBURSEMENT,
          amountPesewas: 80_000,
          borrowerId: 'b2',
          loanId: 'loan-2',
          collectorId: 'user-collector-2',
          recordedAt: '2026-05-01T10:00:00.000Z',
        },
        {
          id: 'tx-1',
          type: TRANSACTION_TYPE.REPAYMENT,
          amountPesewas: 5000,
          borrowerId: 'b1',
          loanId: 'loan-1',
          collectorId: 'user-collector',
          recordedAt: '2026-05-22T10:00:00.000Z',
        },
        {
          id: 'tx-2',
          type: TRANSACTION_TYPE.REPAYMENT,
          amountPesewas: 3000,
          borrowerId: 'b2',
          loanId: 'loan-2',
          collectorId: 'user-collector-2',
          recordedAt: '2026-05-22T10:00:00.000Z',
        },
      ],
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.collectorId === 'user-collector')).toMatchObject({
      expectedPesewas: 5000,
      actualPesewas: 5000,
      collectionRatePercent: 100,
      variancePesewas: 0,
    });
    expect(rows.find((row) => row.collectorId === 'user-collector-2')).toMatchObject({
      expectedPesewas: 3000,
      actualPesewas: 3000,
      collectionRatePercent: 100,
      variancePesewas: 0,
    });
  });

  it('builds recent alerts for missed payments', () => {
    const alerts = buildRecentAlerts(
      [
        {
          id: 'loan-1',
          borrowerId: 'b1',
          borrowerName: 'Ama Mensah',
          status: LOAN_STATUS.ACTIVE,
          amountPesewas: 100_000,
          outstandingPesewas: 50_000,
          weeklyPaymentPesewas: 5000,
          paymentDay: 'Friday',
          startDate: '2026-05-01',
          community: 'Madina',
          groupName: 'Sunrise Women',
          durationWeeks: 20,
          cycleBatch: '2026-Q2',
        },
      ],
      {
        'loan-1': [
          { weekNumber: 1, dueDate: '2026-05-09', status: SCHEDULE_WEEK_STATUS.MISSED, amountPesewas: 5000 },
        ],
      },
    );

    expect(alerts[0]?.message).toContain('Ama Mensah');
    expect(alerts[0]?.severity).toBe('danger');
    expect(alerts[0]?.createdAt).toBeTruthy();
  });

  it('aggregates dashboard summary totals', () => {
    const summary = buildDashboardSummary({
      borrowers: [{ id: 'b1', status: BORROWER_STATUS.APPROVED }],
      loans: [
        {
          id: 'loan-1',
          borrowerId: 'b1',
          borrowerName: 'Ama',
          status: LOAN_STATUS.ACTIVE,
          amountPesewas: 100_000,
          outstandingPesewas: 75_000,
          weeklyPaymentPesewas: 5000,
          paymentDay: 'Friday',
          startDate: '2026-05-01',
          community: 'Madina',
          groupName: 'Sunrise Women',
          durationWeeks: 20,
          cycleBatch: '2026-Q2',
        },
      ],
      transactions: [
        {
          id: 'tx-disburse',
          type: TRANSACTION_TYPE.DISBURSEMENT,
          amountPesewas: 100_000,
          borrowerId: 'b1',
          loanId: 'loan-1',
          collectorId: 'user-admin',
          recordedAt: '2026-05-01T10:00:00.000Z',
        },
        {
          id: 'tx-repay',
          type: TRANSACTION_TYPE.REPAYMENT,
          amountPesewas: 25_000,
          borrowerId: 'b1',
          loanId: 'loan-1',
          collectorId: 'user-collector',
          recordedAt: '2026-05-22T10:00:00.000Z',
        },
      ],
      groupRisk: [{ groupName: 'Sunrise', riskLevel: 'LOW_RISK' }],
      schedulesByLoanId: { 'loan-1': [] },
      referenceDate: '2026-05-22',
    });

    expect(summary.kpis.find((kpi) => kpi.id === 'pool')?.amountPesewas).toBe(
      DEMO_OPERATING_POOL_PESEWAS,
    );
    expect(summary.kpis.find((kpi) => kpi.id === 'disbursed')?.amountPesewas).toBe(100_000);
    expect(summary.kpis.find((kpi) => kpi.id === 'collected')?.amountPesewas).toBe(25_000);
    expect(summary.kpis.find((kpi) => kpi.id === 'outstanding')?.amountPesewas).toBe(75_000);
    expect(summary.totalGroups).toBe(1);
  });
});
