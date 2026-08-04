import { afterEach, describe, expect, it } from 'vitest';
import { buildDefaulterReport } from '../../domain/reports/defaulters.js';

describe('buildDefaulterReport', () => {
  it('returns empty report for no loans', async () => {
    const report = await buildDefaulterReport({ loanRows: [], borrowers: [], payments: [] });
    expect(report.summary.totalDefaulters).toBe(0);
    expect(report.summary.totalOutstandingPesewas).toBe(0);
    expect(report.rows).toHaveLength(0);
  });

  it('counts only DEFAULTED loans', async () => {
    const activeLoan = makeLoan('loan-active', 'b1', 'ACTIVE', 100_000);
    const defaultedLoan = makeLoan('loan-def', 'b2', 'DEFAULTED', 80_000);
    const borrowers = [makeBorrower('b1', 'Ada'), makeBorrower('b2', 'Esi')];

    const report = await buildDefaulterReport({
      loanRows: [activeLoan, defaultedLoan],
      borrowers,
      payments: [],
    });

    expect(report.summary.totalDefaulters).toBe(1);
    expect(report.rows[0]?.borrowerName).toBe('Esi');
  });

  it('accumulates outstandingPesewas across multiple defaulters', async () => {
    const loans = [
      makeLoan('l1', 'b1', 'DEFAULTED', 50_000),
      makeLoan('l2', 'b2', 'DEFAULTED', 75_000),
    ];
    const borrowers = [makeBorrower('b1', 'Ada'), makeBorrower('b2', 'Esi')];

    const report = await buildDefaulterReport({ loanRows: loans, borrowers, payments: [] });

    expect(report.summary.totalDefaulters).toBe(2);
    expect(report.summary.totalOutstandingPesewas).toBe(125_000);
  });

  it('picks the last confirmed payment date for a borrower', async () => {
    const loan = makeLoan('l1', 'b1', 'DEFAULTED', 50_000);
    const borrowers = [makeBorrower('b1', 'Ada')];
    const payments = [
      makePayment('p1', 'b1', '2026-01-10'),
      makePayment('p2', 'b1', '2026-03-15'),
      makePayment('p3', 'b1', '2026-02-01'),
    ];

    const report = await buildDefaulterReport({ loanRows: [loan], borrowers, payments });

    expect(report.rows[0]?.lastPaymentDate).toBe('2026-03-15');
  });
});

function makeLoan(
  id: string,
  borrowerId: string,
  externalStatus: string,
  outstandingPesewas: number,
) {
  return {
    id,
    borrowerId,
    externalStatus: externalStatus as any,
    lifecycleStatus: externalStatus as any,
    principalAmount: String(outstandingPesewas / 100),
    approvedAmount: String(outstandingPesewas / 100),
    disbursedAmount: String(outstandingPesewas / 100),
    installmentAmount: '5',
    loanBalance: String(outstandingPesewas / 100),
    interestAmount: '0',
    penaltyAmount: '0',
    currencyCode: 'GHS',
    durationWeeks: 20,
    paymentDay: 'MONDAY',
    startDate: '2026-01-01',
    cycleBatch: '2026-01',
    loanPoolId: null,
    rejectionReason: null,
    createdByUserId: null,
    approvedByUserId: null,
    disbursedByUserId: null,
    deletedByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    version: 1,
  };
}

function makeBorrower(id: string, fullName: string) {
  return {
    id,
    fullName,
    community: 'Accra',
    groupName: 'Group A',
    phoneNumber: '',
    nationalId: '',
    photo: undefined,
  } as any;
}

function makePayment(id: string, borrowerId: string, paymentDate: string) {
  return {
    id,
    borrowerId,
    collectorId: 'c1',
    amountPesewas: 1000,
    paymentDate,
    recordedAt: `${paymentDate}T10:00:00Z`,
    gps: { latitude: 0, longitude: 0 },
  };
}
