import type { ICollectorManagementService } from '@/types/services';
import { assembleCollectorProfileDetail } from '@/services/mock/collector-profile.builder';
import { getCollectorsDemoDataset } from '@/services/mock/factories/collectors-demo.factory';
import { simulateDelay } from '@/services/mock/delay';

const collectorManagementServiceMock: ICollectorManagementService = {
  async listCollectors() {
    await simulateDelay();

    return getCollectorsDemoDataset();
  },

  async getCollector(id: string) {
    await simulateDelay();

    const { collectors } = getCollectorsDemoDataset();
    const collector = collectors.find((entry) => entry.id === id);

    if (!collector) {
      throw new Error('Collector not found');
    }

    return assembleCollectorProfileDetail(collector);
  },
};

export default collectorManagementServiceMock;
