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
  OfflineQueueItem,
  OfflineQueueSyncState,
  RecordExpenseQueuePayload,
} from '@/types/offline-queue';
import type { RecordPaymentQueuePayload } from '@/types/payment';

interface OfflineQueueState {
  items: OfflineQueueItem[];
  syncState: OfflineQueueSyncState;
  enqueuePayment: (payload: RecordPaymentQueuePayload) => OfflineQueueItem;
  enqueueExpense: (payload: RecordExpenseQueuePayload) => OfflineQueueItem;
  markSyncing: (id: string) => void;
  markSynced: (id: string) => void;
  markQueuedForReview: (id: string) => void;
  markFailed: (id: string, error: string) => void;
  removeSyncedItems: () => void;
  setSyncState: (syncState: OfflineQueueSyncState) => void;
  clearQueue: () => void;
}

function createPaymentQueueItem(payload: RecordPaymentQueuePayload): OfflineQueueItem {
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

function createExpenseQueueItem(payload: RecordExpenseQueuePayload): OfflineQueueItem {
  return {
    id: crypto.randomUUID(),
    type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE,
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
        const item = createPaymentQueueItem(payload);
        set((state) => ({
          items: [...state.items, item],
        }));
        return item;
      },

      enqueueExpense: (payload) => {
        const item = createExpenseQueueItem(payload);
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

      markQueuedForReview: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: OFFLINE_QUEUE_ITEM_STATUS.QUEUED_FOR_REVIEW,
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

export function selectPendingQueueItems(items: OfflineQueueItem[]): OfflineQueueItem[] {
  return items.filter(
    (item) =>
      item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
      item.status === OFFLINE_QUEUE_ITEM_STATUS.SYNCING ||
      item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
  );
}

export function selectPendingQueueCount(items: OfflineQueueItem[]): number {
  return selectPendingQueueItems(items).length;
}

export function selectPendingPaymentCount(items: OfflineQueueItem[]): number {
  return selectPendingQueueItems(items).filter(
    (item) => item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
  ).length;
}

export function selectPendingExpenseCount(items: OfflineQueueItem[]): number {
  return selectPendingQueueItems(items).filter(
    (item) => item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE,
  ).length;
}

export function selectQueuedForReviewPaymentCount(items: OfflineQueueItem[]): number {
  return items.filter(
    (item) =>
      item.type === OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT &&
      item.status === OFFLINE_QUEUE_ITEM_STATUS.QUEUED_FOR_REVIEW,
  ).length;
}

export function selectQueuedForReviewCount(items: OfflineQueueItem[]): number {
  return selectQueuedForReviewPaymentCount(items);
}

export function selectHasQueueWarning(items: OfflineQueueItem[]): boolean {
  return selectPendingQueueCount(items) >= OFFLINE_QUEUE_WARNING_THRESHOLD;
}

export function getOfflineQueueSnapshot(): OfflineQueueItem[] {
  return useOfflineQueueStore.getState().items;
}
