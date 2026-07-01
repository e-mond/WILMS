import type {
  AdjustmentCatalogResponse,
  AdjustmentListResponse,
  AdjustmentRequest,
} from '@/types/adjustment';
import type { IAdjustmentService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

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

  createAdjustment(input, actorId, actorDisplayName): Promise<AdjustmentRequest> {
    return apiClient.post<AdjustmentRequest>('/adjustments', {
      ...input,
      actorId,
      actorDisplayName,
    });
  },

  approveAdjustment(id, actorId, actorDisplayName): Promise<AdjustmentRequest> {
    return apiClient.post<AdjustmentRequest>(`/adjustments/${id}/approve`, {
      actorId,
      actorDisplayName,
    });
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
