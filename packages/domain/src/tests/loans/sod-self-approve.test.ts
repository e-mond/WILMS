import { describe, expect, it, vi } from 'vitest';
import { LOAN_LIFECYCLE } from '../../domain/loan/lifecycle.js';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => true,
  requireDatabase: vi.fn(),
  getDb: () => ({}),
  runInTransaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
}));

vi.mock('../../repositories/loan.repository.js', () => ({
  findLoanById: vi.fn(async () => ({
    id: 'loan-1',
    borrowerId: 'borrower-1',
    lifecycleStatus: LOAN_LIFECYCLE.PENDING_APPROVAL,
    externalStatus: 'PENDING_APPROVAL',
    createdByUserId: 'approver-1',
    version: 1,
    loanBalance: '1000',
    installmentAmount: '50',
    paymentDay: 'MONDAY',
  })),
  updateLoanLifecycle: vi.fn(),
}));

vi.mock('../../modules/borrowers/service.js', () => ({
  assertAdminFeeRecorded: vi.fn(async () => undefined),
}));

vi.mock('../../infrastructure/idempotency/run-with-idempotency.js', () => ({
  runWithIdempotency: async (input: { execute: () => Promise<unknown> }) => input.execute(),
}));

describe('loan approval SoD', () => {
  it('blocks the creator from approving their own loan', async () => {
    const { approveLoan } = await import('../../modules/loans/service.js');
    await expect(approveLoan('loan-1', 'approver-1')).rejects.toThrow(
      /cannot approve a loan you created/i,
    );
  });
});
