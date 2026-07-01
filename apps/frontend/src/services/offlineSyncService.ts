import { apiClient } from '@/utils/apiClient';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';
import type { ResolveSyncConflictInput, SyncConflictListResponse } from '@/types/sync-conflict';
import type { IOfflineSyncService, OfflineSyncBatchResult } from '@/types/services';

const offlineSyncService: IOfflineSyncService = {
  submitOfflinePaymentBatch(items: OfflinePaymentQueueItem[]): Promise<OfflineSyncBatchResult> {
    return apiClient.post<OfflineSyncBatchResult>('/sync/offline/batch', {
      operations: items.map((item) => ({
        idempotencyKey: item.id,
        type: OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT,
        payload: item.payload,
        clientCreatedAt: new Date(item.createdAt).toISOString(),
      })),
    });
  },

  listSyncConflicts(): Promise<SyncConflictListResponse> {
    return apiClient.get<SyncConflictListResponse>('/sync/conflicts');
  },

  approveSyncConflict(conflictId: string, input?: ResolveSyncConflictInput): Promise<unknown> {
    return apiClient.post(`/sync/conflicts/${conflictId}/approve`, input ?? {});
  },

  rejectSyncConflict(conflictId: string, input?: ResolveSyncConflictInput): Promise<unknown> {
    return apiClient.post(`/sync/conflicts/${conflictId}/reject`, input ?? {});
  },
};

export default offlineSyncService;

/** @deprecated Import offlineSyncService from `@/services` instead. */
export const submitOfflinePaymentBatch = offlineSyncService.submitOfflinePaymentBatch.bind(
  offlineSyncService,
);

export type { OfflineSyncBatchResult };
