import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listBorrowers: vi.fn(),
  listPayments: vi.fn(),
  listPaymentsForDate: vi.fn(),
  sumConfirmedPaymentsForDatePesewas: vi.fn(),
  getGroupsForCollector: vi.fn(),
  listLoans: vi.fn(),
  listPayableScheduleWeeksForLoans: vi.fn(),
  findSubmittedReconciliationByCollectorAndDate: vi.fn(),
  isDatabaseEnabled: vi.fn(() => true),
}));

vi.mock('../../db/persistence.js', () => ({
  listBorrowers: mocks.listBorrowers,
  listPayments: mocks.listPayments,
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => mocks.isDatabaseEnabled(),
  getDb: vi.fn(),
}));

vi.mock('../../modules/groups/service.js', () => ({
  getGroupsForCollector: mocks.getGroupsForCollector,
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  listLoans: mocks.listLoans,
}));

vi.mock('../../repositories/payment.repository.js', () => ({
  listPaymentsForDate: mocks.listPaymentsForDate,
  sumConfirmedPaymentsForDatePesewas: mocks.sumConfirmedPaymentsForDatePesewas,
}));

vi.mock('../../repositories/loan-schedule.repository.js', () => ({
  listPayableScheduleWeeksForLoans: mocks.listPayableScheduleWeeksForLoans,
}));

vi.mock('../../repositories/reconciliation.repository.js', () => ({
  findSubmittedReconciliationByCollectorAndDate:
    mocks.findSubmittedReconciliationByCollectorAndDate,
}));

import { getCollectorDashboard } from '../../modules/collector-portal/service.js';

describe('collector dashboard due-today filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDatabaseEnabled.mockReturnValue(true);
    mocks.listBorrowers.mockResolvedValue([
      {
        id: 'b-due',
        fullName: 'Due Borrower',
        phone: '0200000001',
        community: 'Accra',
        groupId: 'g1',
        groupName: 'Group One',
      },
      {
        id: 'b-skip',
        fullName: 'Not Due Borrower',
        phone: '0200000002',
        community: 'Accra',
        groupId: 'g1',
        groupName: 'Group One',
      },
      {
        id: 'b-other-group',
        fullName: 'Other Group Borrower',
        phone: '0200000003',
        community: 'Tema',
        groupId: 'g2',
        groupName: 'Group Two',
      },
    ]);
    mocks.getGroupsForCollector.mockResolvedValue([
      {
        id: 'g1',
        displayName: 'Group One',
        community: 'Accra',
        memberIds: ['b-due', 'b-skip'],
      },
      {
        id: 'g2',
        displayName: 'Group Two',
        community: 'Tema',
        memberIds: ['b-other-group'],
      },
    ]);
    mocks.listPaymentsForDate.mockResolvedValue([]);
    mocks.sumConfirmedPaymentsForDatePesewas.mockResolvedValue(0);
    mocks.findSubmittedReconciliationByCollectorAndDate.mockResolvedValue(null);
    mocks.listLoans.mockResolvedValue([
      {
        id: 'loan-due',
        borrowerId: 'b-due',
        paymentDay: 'MONDAY',
        installmentAmount: '100.00',
      },
      {
        id: 'loan-skip',
        borrowerId: 'b-skip',
        paymentDay: 'WEDNESDAY',
        installmentAmount: '100.00',
      },
      {
        id: 'loan-other',
        borrowerId: 'b-other-group',
        paymentDay: 'FRIDAY',
        installmentAmount: '100.00',
      },
    ]);
    mocks.listPayableScheduleWeeksForLoans.mockResolvedValue([
      {
        loanId: 'loan-due',
        weekNumber: 1,
        dueDate: '2026-08-10',
        status: 'PENDING',
        installmentAmount: '100.00',
      },
    ]);
  });

  it('returns only borrowers and groups with a due installment on the reference date', async () => {
    const dashboard = await getCollectorDashboard('collector-1', '2026-08-10');

    expect(dashboard.borrowers.map((row) => row.borrowerId)).toEqual(['b-due']);
    expect(dashboard.summary.borrowersDueCount).toBe(1);
    expect(dashboard.todayGroups.map((group) => group.groupId)).toEqual(['g1']);
    expect(dashboard.todayGroups[0]?.expectedCount).toBe(1);
  });
});
