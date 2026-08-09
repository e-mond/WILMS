import { submitOfflineHolidayBatch } from '@/services/offlineSyncService';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type {
  OfflineHolidayQueueItem,
  OfflineHolidaySyncOutcome,
} from '@/types/offline-queue';

export async function replayQueuedHolidayRequest(
  item: OfflineHolidayQueueItem,
): Promise<OfflineHolidaySyncOutcome> {
  if (item.type !== OFFLINE_QUEUE_ITEM_TYPE.HOLIDAY_REQUEST_CREATE) {
    throw new Error(`Unsupported offline queue item type: ${item.type}`);
  }

  const result = await submitOfflineHolidayBatch([item]);
  const entry = result.results[0];

  if (!entry) {
    throw new Error('Offline sync returned no result.');
  }

  if (entry.status === 'DUPLICATE') {
    return 'duplicate';
  }

  if (entry.status === 'APPLIED') {
    return 'applied';
  }

  throw new Error(`Unexpected offline sync status: ${entry.status}`);
}
