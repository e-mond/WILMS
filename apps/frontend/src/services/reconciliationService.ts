import type { SubmitReconciliationInput } from '@/types/reconciliation';
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
};

export default reconciliationService;
