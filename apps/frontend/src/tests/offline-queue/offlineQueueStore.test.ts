import { beforeEach, describe, expect, it } from 'vitest';
import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';
import {
  selectHasQueueWarning,
  selectPendingQueueCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

const samplePayload = {
  borrowerId: 'b-1',
  amountPesewas: 10000,
  paymentDate: '2026-06-06',
  gps: {
    latitude: 5.6,
    longitude: -0.2,
    capturedAt: '2026-06-06T10:00:00.000Z',
  },
  collectorId: 'c-1',
};

describe('offlineQueueStore', () => {
  beforeEach(() => {
    useOfflineQueueStore.getState().clearQueue();
  });

  it('enqueues payment actions with pending status', () => {
    const item = useOfflineQueueStore.getState().enqueuePayment(samplePayload);

    expect(item.status).toBe(OFFLINE_QUEUE_ITEM_STATUS.PENDING);
    expect(useOfflineQueueStore.getState().items).toHaveLength(1);
  });

  it('tracks sync lifecycle states', () => {
    const item = useOfflineQueueStore.getState().enqueuePayment(samplePayload);

    useOfflineQueueStore.getState().markSyncing(item.id);
    expect(useOfflineQueueStore.getState().items[0]?.status).toBe(
      OFFLINE_QUEUE_ITEM_STATUS.SYNCING,
    );

    useOfflineQueueStore.getState().markSynced(item.id);
    useOfflineQueueStore.getState().removeSyncedItems();

    expect(useOfflineQueueStore.getState().items).toHaveLength(0);
  });

  it('retains failed items for retry', () => {
    const item = useOfflineQueueStore.getState().enqueuePayment(samplePayload);
    useOfflineQueueStore.getState().markFailed(item.id, 'Server unavailable');

    const stored = useOfflineQueueStore.getState().items[0];
    expect(stored?.status).toBe(OFFLINE_QUEUE_ITEM_STATUS.FAILED);
    expect(stored?.lastError).toBe('Server unavailable');
    expect(selectPendingQueueCount(useOfflineQueueStore.getState().items)).toBe(1);
  });

  it('flags queue warning at threshold', () => {
    for (let index = 0; index < 100; index += 1) {
      useOfflineQueueStore.getState().enqueuePayment({
        ...samplePayload,
        borrowerId: `b-${index}`,
      });
    }

    expect(selectHasQueueWarning(useOfflineQueueStore.getState().items)).toBe(true);
  });
});
