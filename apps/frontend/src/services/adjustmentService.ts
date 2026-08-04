import type {
  AdjustmentCatalogResponse,
  AdjustmentListResponse,
  AdjustmentRequest,
} from '@/types/adjustment';
import type { IAdjustmentService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';
import { financialMutation } from '@/utils/financialMutation';

const adjustmentService: IAdjustmentService = {
  listPendingAdjustments(): Promise<AdjustmentListResponse> {
    return apiClient.get<AdjustmentListResponse>('/adjustments/pending');
  },

  listAdjustments(): Promise<AdjustmentCatalogResponse> {
    return apiClient.get<AdjustmentCatalogResponse>('/adjustments');
  },

  getAdjustment(id: string): Promise<AdjustmentRequest> {
    return apiClient.get<AdjustmentRequest>(`/adjustments/${id}`);
  },

  async createAdjustment(input, actorId, actorDisplayName): Promise<AdjustmentRequest> {
    const { result } = await financialMutation(
      (headers) =>
        apiClient.post<AdjustmentRequest>(
          '/adjustments',
          {
            ...input,
            actorId,
            actorDisplayName,
          },
          { headers },
        ),
      { domain: 'adjustment' },
    );
    return result;
  },

  async approveAdjustment(id, actorId, actorDisplayName): Promise<AdjustmentRequest> {
    const { result } = await financialMutation(
      (headers) =>
        apiClient.post<AdjustmentRequest>(
          `/adjustments/${id}/approve`,
          {
            actorId,
            actorDisplayName,
          },
          { headers },
        ),
      { domain: 'adjustment' },
    );
    return result;
  },

  rejectAdjustment(id, input, actorId, actorDisplayName): Promise<AdjustmentRequest> {
    return apiClient.post<AdjustmentRequest>(`/adjustments/${id}/reject`, {
      ...input,
      actorId,
      actorDisplayName,
    });
  },
};

export default adjustmentService;
