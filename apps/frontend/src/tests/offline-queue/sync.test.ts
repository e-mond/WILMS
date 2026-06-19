import { describe, expect, it, vi } from 'vitest';
import { drainOfflineQueue, getDrainableItems } from '@/lib/offline-queue/sync';
import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';

function createItem(
  overrides: Partial<OfflinePaymentQueueItem> = {},
): OfflinePaymentQueueItem {
  return {
    id: overrides.id ?? 'item-1',
    type: 'RECORD_PAYMENT',
    payload: {
      borrowerId: 'b-1',
      amountPesewas: 5000,
      paymentDate: '2026-06-06',
      gps: {
        latitude: 5.6,
        longitude: -0.2,
        capturedAt: '2026-06-06T10:00:00.000Z',
      },
      collectorId: 'c-1',
    },
    status: OFFLINE_QUEUE_ITEM_STATUS.PENDING,
    createdAt: 1,
    lastAttemptAt: null,
    attemptCount: 0,
    lastError: null,
    ...overrides,
  };
}

describe('offline queue sync', () => {
  it('returns drainable items in FIFO order', () => {
    const items = [
      createItem({ id: 'b', createdAt: 20 }),
      createItem({ id: 'a', createdAt: 10, status: OFFLINE_QUEUE_ITEM_STATUS.SYNCED }),
      createItem({ id: 'c', createdAt: 30, status: OFFLINE_QUEUE_ITEM_STATUS.FAILED }),
    ];

    expect(getDrainableItems(items).map((item) => item.id)).toEqual(['b', 'c']);
  });

  it('drains queue items sequentially', async () => {
    const order: string[] = [];
    const items = [
      createItem({ id: 'first', createdAt: 10 }),
      createItem({ id: 'second', createdAt: 20 }),
    ];

    const result = await drainOfflineQueue(items, async (item) => {
      order.push(item.id);
    });

    expect(order).toEqual(['first', 'second']);
    expect(result.synced).toEqual(['first', 'second']);
    expect(result.failed).toEqual([]);
  });

  it('keeps failed items and reports errors', async () => {
    const syncHandler = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Network timeout'));

    const items = [
      createItem({ id: 'ok', createdAt: 10 }),
      createItem({ id: 'bad', createdAt: 20 }),
    ];

    const result = await drainOfflineQueue(items, syncHandler);

    expect(result.synced).toEqual(['ok']);
    expect(result.failed).toEqual([{ id: 'bad', error: 'Network timeout' }]);
  });
});
