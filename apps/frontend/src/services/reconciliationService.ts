import type { ReconciliationHistoryEntry, SubmitReconciliationInput } from '@/types/reconciliation';
import type { IReconciliationService, ReconciliationSummary } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const reconciliationService: IReconciliationService = {
  getCollectorReconciliation(collectorId: string, date: string): Promise<ReconciliationSummary> {
    return apiClient.get<ReconciliationSummary>(
      `/reconciliation?collectorId=${encodeURIComponent(collectorId)}&date=${encodeURIComponent(date)}`,
    );
  },

  submitReconciliation(input: SubmitReconciliationInput): Promise<ReconciliationSummary> {
    return apiClient.post<ReconciliationSummary>('/reconciliations', input);
  },

  listReconciliations(filter?: { collectorId?: string }): Promise<ReconciliationSummary[]> {
    const query = filter?.collectorId
      ? `?collectorId=${encodeURIComponent(filter.collectorId)}`
      : '';
    return apiClient.get<ReconciliationSummary[]>(`/reconciliations${query}`);
  },

  getReconciliation(id: string): Promise<ReconciliationSummary> {
    return apiClient.get<ReconciliationSummary>(`/reconciliations/${id}`);
  },

  getReconciliationHistory(id: string): Promise<ReconciliationHistoryEntry[]> {
    return apiClient.get<ReconciliationHistoryEntry[]>(`/reconciliations/${id}/history`);
  },
};

export default reconciliationService;
