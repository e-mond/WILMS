import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBorrower: vi.fn(),
  borrowerHasOpenLoan: vi.fn(async () => false),
  findPoolById: vi.fn(),
  listPools: vi.fn(async () => [{ id: 'pool-1' }]),
  findPoolIdForGroup: vi.fn(async () => 'pool-1'),
  insertMembership: vi.fn(),
  insertLoan: vi.fn(),
  insertScheduleWeeks: vi.fn(),
  appendLedgerEntry: vi.fn(),
  hasAdminFee: vi.fn(async () => true),
  listHolidays: vi.fn(async () => []),
  appendAuditEntry: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  requireDatabase: vi.fn(),
  getDb: () => ({}),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/borrower.repository.js', () => ({
  getBorrower: mocks.getBorrower,
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  borrowerHasOpenLoan: mocks.borrowerHasOpenLoan,
  insertLoan: mocks.insertLoan,
  findLoanById: vi.fn(),
  updateLoanLifecycle: vi.fn(),
  listLoans: vi.fn(),
}));

vi.mock('../../repositories/loan-pool.repository.js', () => ({
  findPoolById: mocks.findPoolById,
  listPools: mocks.listPools,
  findPoolIdForGroup: mocks.findPoolIdForGroup,
  insertMembership: mocks.insertMembership,
  findPoolByIdForUpdate: vi.fn(),
}));

vi.mock('../../repositories/loan-schedule.repository.js', () => ({
  insertScheduleWeeks: mocks.insertScheduleWeeks,
  listScheduleWeeks: vi.fn(async () => []),
}));

vi.mock('../../repositories/ledger.repository.js', () => ({
  appendLedgerEntry: mocks.appendLedgerEntry,
}));

vi.mock('../../db/persistence.js', () => ({
  hasAdminFee: mocks.hasAdminFee,
}));

vi.mock('../../modules/organization-holidays/service.js', () => ({
  listHolidays: mocks.listHolidays,
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: mocks.appendAuditEntry,
}));

vi.mock('../../infrastructure/idempotency/run-with-idempotency.js', () => ({
  runWithIdempotency: async (input: { execute: () => Promise<unknown> }) => input.execute(),
}));

describe('createLoan pool capital validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getBorrower.mockResolvedValue({
      id: 'borrower-1',
      status: 'APPROVED',
      groupId: 'group-1',
      fullName: 'Ama Mensah',
    });
    mocks.findPoolById.mockResolvedValue({
      id: 'pool-1',
      name: 'Community Growth Pool',
      capitalPesewas: 30100,
      outstandingPesewas: 0,
    });
  });

  it('rejects creation when requested amount exceeds available pool capital', async () => {
    const { createLoan } = await import('../../modules/loans/service.js');
    await expect(
      createLoan(
        {
          borrowerId: 'borrower-1',
          amountPesewas: 40000,
          durationWeeks: 20,
          paymentDay: 'Friday',
          startDate: '2026-08-14',
          cycleBatch: '2026-W33',
          loanPoolId: 'pool-1',
        },
        'admin-1',
      ),
    ).rejects.toThrow(/Cannot create loan[\s\S]*Additional funding required: GH₵99\.00/i);
    expect(mocks.insertLoan).not.toHaveBeenCalled();
  });

  it('allows creation when available capital covers the request', async () => {
    mocks.insertLoan.mockResolvedValue({
      id: 'loan-1',
      borrowerId: 'borrower-1',
      lifecycleStatus: 'PENDING_APPROVAL',
      externalStatus: 'PENDING_APPROVAL',
      paymentDay: 'Friday',
      principalAmount: '200.00',
      loanBalance: '200.00',
      installmentAmount: '10.00',
      amountPesewas: 20000,
      weeklyPaymentPesewas: 1000,
      durationWeeks: 20,
      version: 1,
      startDate: '2026-08-14',
      cycleBatch: '2026-W33',
    });
    const { createLoan } = await import('../../modules/loans/service.js');
    const loan = await createLoan(
      {
        borrowerId: 'borrower-1',
        amountPesewas: 20000,
        durationWeeks: 20,
        paymentDay: 'Friday',
        startDate: '2026-08-14',
        cycleBatch: '2026-W33',
        loanPoolId: 'pool-1',
      },
      'admin-1',
    );
    expect(loan.id).toBe('loan-1');
    expect(mocks.insertLoan).toHaveBeenCalled();
  });
});
