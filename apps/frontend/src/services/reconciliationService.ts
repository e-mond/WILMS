import type { ReconciliationHistoryEntry, SubmitReconciliationInput } from '@/types/reconciliation';
import type {
  IReconciliationService,
  ReconciliationOpsSnapshot,
  ReconciliationSummary,
  ReviewReconciliationInput,
} from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import { financialMutation } from '@/utils/financialMutation';

const reconciliationService: IReconciliationService = {
  getCollectorReconciliation(collectorId: string, date: string): Promise<ReconciliationSummary> {
    return apiClient.get<ReconciliationSummary>(
      `/reconciliation?collectorId=${encodeURIComponent(collectorId)}&date=${encodeURIComponent(date)}`,
    );
  },

  async submitReconciliation(input: SubmitReconciliationInput): Promise<ReconciliationSummary> {
    const { result } = await financialMutation(
      (headers) =>
        apiClient.post<ReconciliationSummary>('/reconciliations', input, { headers }),
      { domain: 'reconciliation' },
    );
    return result;
  },

  listReconciliations(filter?: { collectorId?: string }): Promise<ReconciliationSummary[]> {
    const query = filter?.collectorId
      ? `?collectorId=${encodeURIComponent(filter.collectorId)}`
      : '';
    return apiClient.get<ReconciliationSummary[]>(`/reconciliations${query}`);
  },

  getReconciliationOpsSnapshot(): Promise<ReconciliationOpsSnapshot> {
    return apiClient.get<ReconciliationOpsSnapshot>('/reconciliations/ops-snapshot');
  },

  getReconciliation(id: string): Promise<ReconciliationSummary> {
    return apiClient.get<ReconciliationSummary>(`/reconciliations/${id}`);
  },

  getReconciliationHistory(id: string): Promise<ReconciliationHistoryEntry[]> {
    return apiClient.get<ReconciliationHistoryEntry[]>(`/reconciliations/${id}/history`);
  },

  reviewReconciliation(id: string, input: ReviewReconciliationInput): Promise<ReconciliationSummary> {
    return apiClient.patch<ReconciliationSummary>(`/reconciliations/${id}/review`, input);
  },
};

export default reconciliationService;
