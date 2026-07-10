import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_QUEUE_ITEM_STATUS, OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflineExpenseQueueItem } from '@/types/offline-queue';

const { createExpense } = vi.hoisted(() => ({
  createExpense: vi.fn(),
}));

vi.mock('@/services', () => ({
  expenseService: {
    createExpense,
  },
}));

import { replayQueuedExpense } from '@/lib/offline-queue/expenseSyncHandler';

function createExpenseItem(): OfflineExpenseQueueItem {
  return {
    id: 'expense-queue-1',
    type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE,
    payload: {
      category: 'FUEL',
      amountPesewas: 12_000,
      expenseDate: '2026-07-08',
      reason: 'Field travel',
      recordedById: 'collector-1',
      recordedByName: 'Collector One',
    },
    status: OFFLINE_QUEUE_ITEM_STATUS.PENDING,
    createdAt: Date.now(),
    lastAttemptAt: null,
    attemptCount: 0,
    lastError: null,
  };
}

describe('replayQueuedExpense', () => {
  beforeEach(() => {
    createExpense.mockReset();
    createExpense.mockResolvedValue({ id: 'expense-1' });
  });

  it('submits queued expense through expense service', async () => {
    const item = createExpenseItem();

    const outcome = await replayQueuedExpense(item);

    expect(createExpense).toHaveBeenCalledWith(item.payload);
    expect(outcome).toBe('applied');
  });
});
