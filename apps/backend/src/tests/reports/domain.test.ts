import { describe, expect, it } from 'vitest';
import { buildLoanPortfolioReport } from '../../domain/reports/loan-portfolio.js';
import { buildCollectorPerformanceReport } from '../../domain/reports/collector-performance.js';
import { buildGroupRiskReport } from '../../domain/reports/group-risk.js';
import { buildFinancialLedgerReport } from '../../domain/reports/financial-ledger.js';

describe('loan-portfolio report', () => {
  it('filters by status and summarizes entries', () => {
    const report = buildLoanPortfolioReport(
      [
        {
          id: 'loan-1',
          displayId: 'LOAN-202601-202601-0001',
          borrowerId: 'b1',
          borrowerName: 'Ada',
          community: 'Tamale',
          groupName: 'G1',
          amountPesewas: 100_000,
          outstandingPesewas: 50_000,
          weeklyPaymentPesewas: 5_000,
          durationWeeks: 20,
          status: 'ACTIVE',
          cycleBatch: '2026-01',
          paymentDay: 'MONDAY',
          startDate: '2026-01-01',
        },
        {
          id: 'loan-2',
          displayId: 'LOAN-202512-202512-0001',
          borrowerId: 'b2',
          borrowerName: 'Esi',
          community: 'Accra',
          groupName: 'G2',
          amountPesewas: 80_000,
          outstandingPesewas: 0,
          weeklyPaymentPesewas: 4_000,
          durationWeeks: 20,
          status: 'COMPLETED',
          cycleBatch: '2025-12',
          paymentDay: 'FRIDAY',
          startDate: '2025-12-01',
        },
      ],
      { status: 'ACTIVE' },
    );

    expect(report.entries).toHaveLength(1);
    expect(report.summary.activeLoans).toBe(1);
    expect(report.summary.totalOutstandingPesewas).toBe(50_000);
    expect(report.generatedAt).toBeTruthy();
  });
});

describe('collector-performance report', () => {
  it('maps collector summaries to report rows', () => {
    const report = buildCollectorPerformanceReport([
      {
        id: 'col-1',
        displayId: 'COL-001',
        displayName: 'Collector One',
        photoUrl: null,
        zone: 'North',
        groupCount: 2,
        borrowerCount: 10,
        expectedPesewas: 100_000,
        collectedPesewas: 90_000,
        collectionRatePercent: 90,
        recoveryRatePercent: 90,
        reconciliationCount: 1,
        expensesSubmittedCount: 0,
        status: 'ACTIVE',
        streakWeeks: 0,
        cycleLabel: 'Current',
        joinedAt: '2026-01-01T00:00:00.000Z',
        lastActiveAt: '2026-06-01T00:00:00.000Z',
        rateTrend: [90],
        monthlyPerformance: [],
      },
    ]);

    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]?.collectorName).toBe('Collector One');
    expect(report.rows[0]?.collectionRatePercent).toBe(90);
  });
});

describe('group-risk report', () => {
  it('maps group summaries to risk rows', () => {
    const report = buildGroupRiskReport([
      {
        id: 'grp-1',
        name: 'Group A',
        groupSystemId: 'SYS-1',
        displayName: 'Group A',
        community: 'Tamale',
        officerName: 'Officer',
        formedAt: '2026-01-01T00:00:00.000Z',
        memberCount: 5,
        activeMemberCount: 4,
        disbursedPesewas: 500_000,
        collectedPesewas: 400_000,
        collectionRatePercent: 80,
        riskLevel: 'AT_RISK',
      },
    ]);

    expect(report.rows[0]?.riskLevel).toBe('AT_RISK');
    expect(report.rows[0]?.memberCount).toBe(5);
  });
});

describe('financial-ledger report', () => {
  it('filters payments by date range', () => {
    const report = buildFinancialLedgerReport(
      [
        {
          id: 'pay-1',
          borrowerId: 'b1',
          collectorId: 'c1',
          amountPesewas: 5_000,
          paymentDate: '2026-06-01',
          recordedAt: '2026-06-01T10:00:00.000Z',
        },
        {
          id: 'pay-2',
          borrowerId: 'b2',
          collectorId: 'c1',
          amountPesewas: 3_000,
          paymentDate: '2026-05-01',
          recordedAt: '2026-05-01T10:00:00.000Z',
        },
      ],
      { fromDate: '2026-06-01', toDate: '2026-06-30' },
    );

    expect(report.rows).toHaveLength(1);
    expect(report.rows[0]?.type).toBe('REPAYMENT');
  });
});
