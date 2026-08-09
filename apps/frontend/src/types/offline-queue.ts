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
  HOLIDAY_REQUEST_CREATE: 'HOLIDAY_REQUEST_CREATE',
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

export interface HolidayRequestQueuePayload {
  name: string;
  holidayDate: string;
  endDate?: string | null;
  reason?: string | null;
  notes?: string | null;
  evidenceUrl?: string | null;
  community?: string | null;
  groupId?: string | null;
  borrowerId?: string | null;
  scope?: string;
  branch?: string | null;
  submit: boolean;
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

export interface OfflineHolidayQueueItem {
  id: string;
  type: typeof OFFLINE_QUEUE_ITEM_TYPE.HOLIDAY_REQUEST_CREATE;
  payload: HolidayRequestQueuePayload;
  status: OfflineQueueItemStatus;
  createdAt: number;
  lastAttemptAt: number | null;
  attemptCount: number;
  lastError: string | null;
}

export type OfflineQueueItem =
  | OfflinePaymentQueueItem
  | OfflineExpenseQueueItem
  | OfflineHolidayQueueItem;

export type OfflinePaymentSyncOutcome = 'applied' | 'duplicate' | 'queued_for_review';

export type OfflinePaymentSyncHandler = (
  item: OfflinePaymentQueueItem,
) => Promise<OfflinePaymentSyncOutcome>;

export type OfflineExpenseSyncOutcome = 'applied';

export type OfflineExpenseSyncHandler = (
  item: OfflineExpenseQueueItem,
) => Promise<OfflineExpenseSyncOutcome>;

export type OfflineHolidaySyncOutcome = 'applied' | 'duplicate';

export type OfflineHolidaySyncHandler = (
  item: OfflineHolidayQueueItem,
) => Promise<OfflineHolidaySyncOutcome>;

export type OfflineQueueSyncState = 'idle' | 'syncing';
