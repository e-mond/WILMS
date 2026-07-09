import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_QUEUE_ITEM_STATUS, OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';

const { submitOfflinePaymentBatch } = vi.hoisted(() => ({
  submitOfflinePaymentBatch: vi.fn(),
}));

vi.mock('@/services/offlineSyncService', () => ({
  submitOfflinePaymentBatch,
}));

import { replayQueuedPayment } from '@/lib/offline-queue/paymentSyncHandler';

function createQueueItem(): OfflinePaymentQueueItem {
  return {
    id: 'queue-item-1',
    type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
    payload: {
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-06-06',
      gps: {
        latitude: 5.6,
        longitude: -0.2,
        capturedAt: '2026-06-06T10:00:00.000Z',
      },
      collectorId: 'collector-001',
    },
    status: OFFLINE_QUEUE_ITEM_STATUS.PENDING,
    createdAt: Date.now(),
    lastAttemptAt: null,
    attemptCount: 0,
    lastError: null,
  };
}

describe('replayQueuedPayment', () => {
  beforeEach(() => {
    submitOfflinePaymentBatch.mockReset();
    submitOfflinePaymentBatch.mockResolvedValue({
      results: [{ idempotencyKey: 'queue-item-1', status: 'QUEUED_FOR_REVIEW', operationId: 'op-1' }],
    });
  });

  it('submits queued payment through offline sync batch API', async () => {
    const item = createQueueItem();

    const outcome = await replayQueuedPayment(item);

    expect(submitOfflinePaymentBatch).toHaveBeenCalledWith([item]);
    expect(outcome).toBe('queued_for_review');
  });

  it('returns applied when sync applies payment immediately', async () => {
    submitOfflinePaymentBatch.mockResolvedValue({
      results: [{ idempotencyKey: 'queue-item-1', status: 'APPLIED', operationId: 'op-1' }],
    });

    const outcome = await replayQueuedPayment(createQueueItem());

    expect(outcome).toBe('applied');
  });
});
