import type { CollectorDetail, CollectorListResponse } from '@/types/collector-management';
import type { ICollectorManagementService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const collectorManagementService: ICollectorManagementService = {
  listCollectors(): Promise<CollectorListResponse> {
    return apiClient.get<CollectorListResponse>('/collectors');
  },

  getCollector(id: string): Promise<CollectorDetail> {
    return apiClient.get<CollectorDetail>(`/collectors/${id}`);
  },
};

export default collectorManagementService;
