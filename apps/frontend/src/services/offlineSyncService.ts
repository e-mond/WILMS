import { apiClient } from '@/utils/apiClient';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';

export interface OfflineSyncBatchResult {
  results: Array<{
    idempotencyKey: string;
    status: 'DUPLICATE' | 'QUEUED_FOR_REVIEW' | 'APPLIED';
    operationId: string;
    conflictId?: string;
  }>;
}

export async function submitOfflinePaymentBatch(
  items: OfflinePaymentQueueItem[],
): Promise<OfflineSyncBatchResult> {
  return apiClient.post<OfflineSyncBatchResult>('/sync/offline/batch', {
    operations: items.map((item) => ({
      idempotencyKey: item.id,
      type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
      payload: item.payload,
      clientCreatedAt: new Date(item.createdAt).toISOString(),
    })),
  });
}
