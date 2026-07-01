import type {
  CollectorDetail,
  CollectorListResponse,
  OnboardCollectorInput,
} from '@/types/collector-management';
import type { ICollectorManagementService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const collectorManagementService: ICollectorManagementService = {
  listCollectors(): Promise<CollectorListResponse> {
    return apiClient.get<CollectorListResponse>('/collectors');
  },

  getCollector(id: string): Promise<CollectorDetail> {
    return apiClient.get<CollectorDetail>(`/collectors/${id}`);
  },

  onboardCollector(input: OnboardCollectorInput): Promise<CollectorDetail> {
    return apiClient.post<CollectorDetail>('/collectors', input);
  },
};

export default collectorManagementService;
