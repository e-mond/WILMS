import { OFFLINE_QUEUE_ITEM_STATUS } from '@/types/offline-queue';
import type {
  OfflinePaymentQueueItem,
  OfflinePaymentSyncHandler,
} from '@/types/offline-queue';

export interface DrainOfflineQueueResult {
  synced: string[];
  failed: Array<{ id: string; error: string }>;
}

export function getDrainableItems(
  items: OfflinePaymentQueueItem[],
): OfflinePaymentQueueItem[] {
  return items
    .filter(
      (item) =>
        item.status === OFFLINE_QUEUE_ITEM_STATUS.PENDING ||
        item.status === OFFLINE_QUEUE_ITEM_STATUS.FAILED,
    )
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function drainOfflineQueue(
  items: OfflinePaymentQueueItem[],
  syncHandler: OfflinePaymentSyncHandler,
): Promise<DrainOfflineQueueResult> {
  const drainable = getDrainableItems(items);
  const synced: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const item of drainable) {
    try {
      await syncHandler(item);
      synced.push(item.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      failed.push({ id: item.id, error: message });
    }
  }

  return { synced, failed };
}
