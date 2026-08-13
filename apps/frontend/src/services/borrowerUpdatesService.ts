import type { BorrowerUpdateRequest } from '@/types/borrower-updates';
import { apiClient } from '@/utils/apiClient';

export const borrowerUpdatesService = {
  listRequests(params?: { mine?: boolean; status?: string }): Promise<{ requests: BorrowerUpdateRequest[] }> {
    const search = new URLSearchParams();
    if (params?.mine) {
      search.set('mine', '1');
    }
    if (params?.status) {
      search.set('status', params.status);
    }
    const query = search.toString();
    return apiClient.get<{ requests: BorrowerUpdateRequest[] }>(
      `/borrower-update-requests${query ? `?${query}` : ''}`,
    );
  },

  createRequest(input: {
    borrowerId: string;
    field: string;
    afterValue: string;
    reason: string;
  }): Promise<BorrowerUpdateRequest> {
    return apiClient.post<BorrowerUpdateRequest>('/borrower-update-requests', input);
  },

  approve(id: string, reviewNote?: string): Promise<BorrowerUpdateRequest> {
    return apiClient.post<BorrowerUpdateRequest>(`/borrower-update-requests/${id}/approve`, {
      reviewNote,
    });
  },

  reject(id: string, reviewNote?: string): Promise<BorrowerUpdateRequest> {
    return apiClient.post<BorrowerUpdateRequest>(`/borrower-update-requests/${id}/reject`, {
      reviewNote,
    });
  },
};

export default borrowerUpdatesService;
