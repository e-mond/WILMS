import type { CollectorDashboard } from '@/types/collector-dashboard';
import type { ICollectorService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const collectorService: ICollectorService = {
  getDashboard(collectorId: string, date?: string): Promise<CollectorDashboard> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get<CollectorDashboard>(`/collector/${collectorId}/dashboard${query}`);
  },

  listAssignedBorrowers(collectorId: string, date?: string) {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    return apiClient.get<CollectorDashboard['borrowers']>(
      `/collector/${collectorId}/borrowers${query}`,
    );
  },
};

export default collectorService;
