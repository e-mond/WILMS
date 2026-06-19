import type { ICollectionMetricsService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const collectionMetricsService: ICollectionMetricsService = {
  getMetrics(query) {
    const params = new URLSearchParams({
      period: query.period,
      ...(query.scope ? { scope: query.scope } : {}),
      ...(query.scopeId ? { scopeId: query.scopeId } : {}),
      ...(query.referenceDate ? { referenceDate: query.referenceDate } : {}),
    });

    return apiClient.get(`/analytics/collections?${params.toString()}`);
  },
};

export default collectionMetricsService;
