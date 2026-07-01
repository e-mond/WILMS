import type { IOfflineSyncService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';

const offlineSyncServiceMock: IOfflineSyncService = {
  async submitOfflinePaymentBatch(items) {
    await simulateDelay();
    return {
      results: items.map((item) => ({
        idempotencyKey: item.id,
        status: 'APPLIED' as const,
        operationId: `op-${item.id}`,
      })),
    };
  },

  async listSyncConflicts() {
    await simulateDelay();
    return { conflicts: [] };
  },

  async approveSyncConflict(conflictId: string) {
    await simulateDelay();
    return { conflictId, status: 'APPROVED' };
  },

  async rejectSyncConflict(conflictId: string) {
    await simulateDelay();
    return { conflictId, status: 'REJECTED' };
  },
};

export default offlineSyncServiceMock;
