import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LOAN_LIFECYCLE } from '../../domain/loan/lifecycle.js';
import { USER_ROLE } from '@wilms/shared-rbac';

const mocks = vi.hoisted(() => ({
  findLoanById: vi.fn(),
  updateLoanLifecycle: vi.fn(),
  getUserById: vi.fn(),
  hasAdminFee: vi.fn(async () => true),
  appendLedgerEntry: vi.fn(),
  getBorrower: vi.fn(async () => ({
    id: 'borrower-1',
    fullName: 'Ama Mensah',
    phone: '0244000000',
    profile: {},
  })),
  notifyLoanApproved: vi.fn(),
}));

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  requireDatabase: vi.fn(),
  getDb: () => ({}),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  findLoanById: mocks.findLoanById,
  updateLoanLifecycle: mocks.updateLoanLifecycle,
  borrowerHasOpenLoan: vi.fn(),
  insertLoan: vi.fn(),
  listLoans: vi.fn(),
}));

vi.mock('../../repositories/user.repository.js', () => ({
  getUserById: mocks.getUserById,
}));

vi.mock('../../db/persistence.js', () => ({
  hasAdminFee: mocks.hasAdminFee,
}));

vi.mock('../../repositories/ledger.repository.js', () => ({
  appendLedgerEntry: mocks.appendLedgerEntry,
}));

vi.mock('../../repositories/borrower.repository.js', () => ({
  getBorrower: mocks.getBorrower,
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: vi.fn(),
}));

vi.mock('../../infrastructure/notifications/event-dispatch.js', () => ({
  notifyLoanApproved: mocks.notifyLoanApproved,
  notifyLoanRejected: vi.fn(),
  notifyLoanDisbursed: vi.fn(),
}));

vi.mock('../../infrastructure/idempotency/run-with-idempotency.js', () => ({
  runWithIdempotency: async (input: { execute: () => Promise<unknown> }) => input.execute(),
}));

describe('loan approval SoD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findLoanById.mockResolvedValue({
      id: 'loan-1',
      borrowerId: 'borrower-1',
      lifecycleStatus: LOAN_LIFECYCLE.PENDING_APPROVAL,
      externalStatus: 'PENDING_APPROVAL',
      createdByUserId: 'approver-1',
      version: 1,
      loanBalance: '1000.00',
      installmentAmount: '50.00',
      paymentDay: 'Monday',
      principalAmount: '1000.00',
      amountPesewas: 100000,
      durationWeeks: 20,
      startDate: '2026-08-10',
      cycleBatch: '2026-W33',
    });
    mocks.updateLoanLifecycle.mockImplementation(async (input: { lifecycleStatus: string }) => ({
      id: 'loan-1',
      borrowerId: 'borrower-1',
      lifecycleStatus: input.lifecycleStatus,
      externalStatus: 'PENDING_DISBURSEMENT',
      version: 2,
      paymentDay: 'Monday',
      principalAmount: '1000.00',
      loanBalance: '1000.00',
      installmentAmount: '50.00',
      amountPesewas: 100000,
      weeklyPaymentPesewas: 5000,
      durationWeeks: 20,
      startDate: '2026-08-10',
      cycleBatch: '2026-W33',
    }));
  });

  it('blocks the creator from approving their own loan when not Super Admin', async () => {
    mocks.getUserById.mockResolvedValue({
      id: 'approver-1',
      role: USER_ROLE.APPROVER,
    });
    const { approveLoan } = await import('../../modules/loans/service.js');
    await expect(approveLoan('loan-1', 'approver-1')).rejects.toThrow(
      /cannot approve a loan you created/i,
    );
  });

  it('allows Super Admin to approve a loan they created', async () => {
    mocks.getUserById.mockResolvedValue({
      id: 'approver-1',
      role: USER_ROLE.SUPER_ADMIN,
    });
    const { approveLoan } = await import('../../modules/loans/service.js');
    const result = await approveLoan('loan-1', 'approver-1');
    expect(result.id).toBe('loan-1');
    expect(mocks.updateLoanLifecycle).toHaveBeenCalled();
  });
});
