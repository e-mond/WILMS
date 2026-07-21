import { afterEach, describe, expect, it } from 'vitest';
import {
  __resetExpensesForTests,
  createExpense,
  reviewExpense,
  listExpenses,
} from '../../modules/expenses/service.js';

describe('expense maker-checker', () => {
  afterEach(() => {
    __resetExpensesForTests();
  });

  it('creates expenses as PENDING without self-approval', async () => {
    const created = await createExpense({
      category: 'TRANSPORT',
      amountPesewas: 2500,
      expenseDate: '2026-07-21',
      reason: 'Field travel',
      recordedById: 'collector-1',
      recordedByName: 'Collector One',
    });

    expect(created.status).toBe('PENDING');
    const listed = await listExpenses();
    expect(listed.summary.pendingCount).toBe(1);
    expect(listed.summary.approvedTotalPesewas).toBe(0);
  });

  it('blocks the recorder from approving their own expense', async () => {
    const created = await createExpense({
      category: 'TRANSPORT',
      amountPesewas: 1000,
      expenseDate: '2026-07-21',
      reason: 'Fuel',
      recordedById: 'collector-1',
      recordedByName: 'Collector One',
    });

    await expect(
      reviewExpense(created.id, { status: 'APPROVED' }, 'collector-1'),
    ).rejects.toThrow(/FORBIDDEN:/);
  });

  it('allows a different reviewer to approve; rejection requires a reason', async () => {
    const created = await createExpense({
      category: 'OFFICE',
      amountPesewas: 5000,
      expenseDate: '2026-07-21',
      reason: 'Stationery',
      recordedById: 'collector-1',
      recordedByName: 'Collector One',
    });

    await expect(
      reviewExpense(created.id, { status: 'REJECTED' }, 'approver-1'),
    ).rejects.toThrow(/VALIDATION:/);

    const approved = await reviewExpense(
      created.id,
      { status: 'APPROVED', reviewNote: 'Looks good' },
      'approver-1',
    );
    expect(approved.status).toBe('APPROVED');

    // Idempotent re-approve
    const again = await reviewExpense(
      created.id,
      { status: 'APPROVED' },
      'approver-1',
    );
    expect(again.status).toBe('APPROVED');
  });
});
