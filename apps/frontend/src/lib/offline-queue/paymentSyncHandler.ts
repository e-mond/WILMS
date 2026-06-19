import { paymentService } from '@/services';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type { OfflinePaymentQueueItem } from '@/types/offline-queue';

export async function replayQueuedPayment(item: OfflinePaymentQueueItem): Promise<void> {
  if (item.type !== OFFLINE_QUEUE_ITEM_TYPE.RECORD_PAYMENT) {
    throw new Error(`Unsupported offline queue item type: ${item.type}`);
  }

  await paymentService.recordPayment({
    borrowerId: item.payload.borrowerId,
    amountPesewas: item.payload.amountPesewas,
    paymentDate: item.payload.paymentDate,
    collectorId: item.payload.collectorId,
    gps: item.payload.gps,
  });
}
