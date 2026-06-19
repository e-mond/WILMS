import type { RecordPaymentQueuePayload } from '@/types/payment';

export const OFFLINE_QUEUE_ITEM_STATUS = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
} as const;

export type OfflineQueueItemStatus =
  (typeof OFFLINE_QUEUE_ITEM_STATUS)[keyof typeof OFFLINE_QUEUE_ITEM_STATUS];

export const OFFLINE_QUEUE_ITEM_TYPE = {
  RECORD_PAYMENT: 'RECORD_PAYMENT',
} as const;

export type OfflineQueueItemType =
  (typeof OFFLINE_QUEUE_ITEM_TYPE)[keyof typeof OFFLINE_QUEUE_ITEM_TYPE];

export interface OfflinePaymentQueueItem {
  id: string;
  type: typeof OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT;
  payload: RecordPaymentQueuePayload;
  status: OfflineQueueItemStatus;
  createdAt: number;
  lastAttemptAt: number | null;
  attemptCount: number;
  lastError: string | null;
}

export type OfflinePaymentSyncHandler = (
  item: OfflinePaymentQueueItem,
) => Promise<void>;

export type OfflineQueueSyncState = 'idle' | 'syncing';
