import type { ExpenseCategory } from '@/types/expense';
import type { RecordPaymentQueuePayload } from '@/types/payment';

export const OFFLINE_QUEUE_ITEM_STATUS = {
  PENDING: 'PENDING',
  SYNCING: 'SYNCING',
  SYNCED: 'SYNCED',
  QUEUED_FOR_REVIEW: 'QUEUED_FOR_REVIEW',
  FAILED: 'FAILED',
} as const;

export type OfflineQueueItemStatus =
  (typeof OFFLINE_QUEUE_ITEM_STATUS)[keyof typeof OFFLINE_QUEUE_ITEM_STATUS];

export const OFFLINE_QUEUE_ITEM_TYPE = {
  RECORD_PAYMENT: 'RECORD_PAYMENT',
  RECORD_EXPENSE: 'RECORD_EXPENSE',
} as const;

export type OfflineQueueItemType =
  (typeof OFFLINE_QUEUE_ITEM_TYPE)[keyof typeof OFFLINE_QUEUE_ITEM_TYPE];

export interface RecordExpenseQueuePayload {
  category: ExpenseCategory;
  amountPesewas: number;
  expenseDate: string;
  reason: string;
  notes?: string;
  receiptFileName?: string;
  receiptUploadId?: string;
  recordedById: string;
  recordedByName: string;
}

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

export interface OfflineExpenseQueueItem {
  id: string;
  type: typeof OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE;
  payload: RecordExpenseQueuePayload;
  status: OfflineQueueItemStatus;
  createdAt: number;
  lastAttemptAt: number | null;
  attemptCount: number;
  lastError: string | null;
}

export type OfflineQueueItem = OfflinePaymentQueueItem | OfflineExpenseQueueItem;

export type OfflinePaymentSyncOutcome = 'applied' | 'duplicate' | 'queued_for_review';

export type OfflinePaymentSyncHandler = (
  item: OfflinePaymentQueueItem,
) => Promise<OfflinePaymentSyncOutcome>;

export type OfflineExpenseSyncOutcome = 'applied';

export type OfflineExpenseSyncHandler = (
  item: OfflineExpenseQueueItem,
) => Promise<OfflineExpenseSyncOutcome>;

export type OfflineQueueSyncState = 'idle' | 'syncing';
