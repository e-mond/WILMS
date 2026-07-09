import { submitOfflinePaymentBatch } from '@/services/offlineSyncService';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type {
  OfflinePaymentQueueItem,
  OfflinePaymentSyncOutcome,
} from '@/types/offline-queue';

export async function replayQueuedPayment(
  item: OfflinePaymentQueueItem,
): Promise<OfflinePaymentSyncOutcome> {
  if (item.type !== OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT) {
    throw new Error(`Unsupported offline queue item type: ${item.type}`);
  }

  const result = await submitOfflinePaymentBatch([item]);
  const entry = result.results[0];

  if (!entry) {
    throw new Error('Offline sync returned no result.');
  }

  if (entry.status === 'QUEUED_FOR_REVIEW') {
    return 'queued_for_review';
  }

  if (entry.status === 'DUPLICATE') {
    return 'duplicate';
  }

  if (entry.status === 'APPLIED') {
    return 'applied';
  }

  throw new Error(`Unexpected offline sync status: ${entry.status}`);
}
