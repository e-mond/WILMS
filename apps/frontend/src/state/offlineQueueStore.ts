import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  OFFLINE_QUEUE_STORAGE_KEY,
  OFFLINE_QUEUE_WARNING_THRESHOLD,
} from '@/constants/offline-queue';
import {
  OFFLINE_QUEUE_ITEM_STATUS,
  OFFLINE_QUEUE_ITEM_TYPE,
} from '@/types/offline-queue';
import type {
  OfflinePaymentQueueItem,
  OfflineQueueSyncState,
} from '@/types/offline-queue';
import type { RecordPaymentQueuePayload } from '@/types/payment';

interface OfflineQueueState {
  items: OfflinePaymentQueueItem[];
  syncState: OfflineQueueSyncState;
  enqueuePayment: (payload: RecordPaymentQueuePayload) => OfflinePaymentQueueItem;
  markSyncing: (id: string) => void;
  markSynced: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  removeSyncedItems: () => void;
  setSyncState: (syncState: OfflineQueueSyncState) => void;
  clearQueue: () => void;
}

function createQueueItem(payload: RecordPaymentQueuePayload): OfflinePaymentQueueItem {
  return {
    id: crypto.randomUUID(),
    type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
    payload,
    status: OFFLINE_QUEUE_ITEM_STATUS.PENDING,
    createdAt: Date.now(),
    lastAttemptAt: null,
    attemptCount: 0,
    lastError: null,
  };
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      items: [],
      syncState: 'idle',

      enqueuePayment: (payload) => {
        const item = createQueueItem(payload);
        set((state) => ({
          items: [...state.items, item],
        }));
        return item;
      },

      markSyncing: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: OFFLINE_QUEUE_ITEM_STATUS.SYNCING,
                  lastAttemptAt: Date.now(),
                  attemptCount: item.attemptCount + 1,
                  lastError: null,
                }
              : item,
          ),
        }));
      },

      markSynced: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: OFFLINE_QUEUE_ITEM_STATUS.SYNCED,
                  lastError: null,
                }
              : item,
          ),
        }));
      },

      markFailed: (id, error) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: OFFLINE_QUEUE_ITEM_STATUS.FAILED,
                  lastError: error,
                }
              : item,
          ),
        }));
      },

      removeSyncedItems: () => {
        set((state) => ({
          items: state.items.filter(
            (item) => item.status !== OFFLINE_QUEUE_ITEM_STATUS.SYNCED,
          ),
        }));
      },

      setSyncState: (syncState) => {
        set({ syncState });
      },

      clearQueue: () => {
        set({ items: [], syncState: 'idle' });
      },
    }),
    {
      name: OFFLINE_QUEUE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function selectPendingQueueItems(
  items: OfflinePaymentQueueItem[],
): OfflinePaymentQueueItem[] {
  return items.filter(
    (item) =>
      item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
      item.status === OFFLINE_QUEUE_ITEM_STATUS.SYNCING ||
      item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
  );
}

export function selectPendingQueueCount(items: OfflinePaymentQueueItem[]): number {
  return selectPendingQueueItems(items).length;
}

export function selectHasQueueWarning(items: OfflinePaymentQueueItem[]): boolean {
  return selectPendingQueueCount(items) >= OFFLINE_QUEUE_WARNING_THRESHOLD;
}

export function getOfflineQueueSnapshot(): OfflinePaymentQueueItem[] {
  return useOfflineQueueStore.getState().items;
}
