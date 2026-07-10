import { expenseService } from '@/services';
import { OFFLINE_QUEUE_ITEM_TYPE } from '@/types/offline-queue';
import type {
  OfflineExpenseQueueItem,
  OfflineExpenseSyncOutcome,
} from '@/types/offline-queue';

export async function replayQueuedExpense(
  item: OfflineExpenseQueueItem,
): Promise<OfflineExpenseSyncOutcome> {
  if (item.type !== OFFLINE_QUEUE_ITEM_TYPE.RECORD_EXPENSE) {
    throw new Error(`Unsupported offline queue item type: ${item.type}`);
  }

  await expenseService.createExpense(item.payload);
  return 'applied';
}
