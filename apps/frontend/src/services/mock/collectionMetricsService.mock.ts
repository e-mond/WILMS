import type { ICollectionMetricsService } from '@/types/services';
import { buildCollectionMetrics } from '@/services/mock/collection-metrics.builder';
import { simulateDelay } from '@/services/mock/delay';

const collectionMetricsServiceMock: ICollectionMetricsService = {
  async getMetrics(query) {
    await simulateDelay();
    return buildCollectionMetrics(query);
  },
};

export default collectionMetricsServiceMock;
