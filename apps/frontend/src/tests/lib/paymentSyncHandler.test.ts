import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_QUEUE_ITEM_STATUS, OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';

const { recordPayment } = vi.hoisted(() => ({
  recordPayment: vi.fn(),
}));

vi.mock('@/services', () => ({
  paymentService: {
    recordPayment,
  },
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
    recordPayment.mockReset();
    recordPayment.mockResolvedValue({ id: 'payment-1' });
  });

  it('replays queued payment payloads through paymentService', async () => {
    const item = createQueueItem();

    await replayQueuedPayment(item);

    expect(recordPayment).toHaveBeenCalledWith({
      borrowerId: 'borrower-001',
      amountPesewas: 5000,
      paymentDate: '2026-06-06',
      collectorId: 'collector-001',
      gps: item.payload.gps,
    });
  });
});
