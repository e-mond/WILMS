import type { CreateHolidayRequestInput, HolidayRequest } from '@/types/holiday-requests';
import { apiClient } from '@/utils/apiClient';

export const holidayRequestsService = {
  listRequests(params?: { mine?: boolean; status?: string }): Promise<{ requests: HolidayRequest[] }> {
    const search = new URLSearchParams();
    if (params?.mine) {
      search.set('mine', '1');
    }
    if (params?.status) {
      search.set('status', params.status);
    }
    const query = search.toString();
    return apiClient.get<{ requests: HolidayRequest[] }>(
      `/holiday-requests${query ? `?${query}` : ''}`,
    );
  },

  createRequest(input: CreateHolidayRequestInput): Promise<HolidayRequest> {
    return apiClient.post<HolidayRequest>('/holiday-requests', input);
  },

  updateDraft(
    id: string,
    input: Partial<CreateHolidayRequestInput>,
  ): Promise<HolidayRequest> {
    return apiClient.patch<HolidayRequest>(`/holiday-requests/${id}`, input);
  },

  submit(id: string): Promise<HolidayRequest> {
    return apiClient.post<HolidayRequest>(`/holiday-requests/${id}/submit`, {});
  },

  approve(id: string, reviewNote?: string): Promise<HolidayRequest> {
    return apiClient.post<HolidayRequest>(`/holiday-requests/${id}/approve`, { reviewNote });
  },

  reject(id: string, reviewNote?: string): Promise<HolidayRequest> {
    return apiClient.post<HolidayRequest>(`/holiday-requests/${id}/reject`, { reviewNote });
  },

  apply(id: string): Promise<HolidayRequest> {
    return apiClient.post<HolidayRequest>(`/holiday-requests/${id}/apply`, {});
  },
};

export default holidayRequestsService;
