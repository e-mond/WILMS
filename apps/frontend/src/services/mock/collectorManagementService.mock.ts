import type { ICollectorManagementService } from '@/types/services';
import type { OnboardCollectorInput } from '@/types/collector-management';
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

  async onboardCollector(input: OnboardCollectorInput) {
    await simulateDelay();
    const { collectors } = getCollectorsDemoDataset();
    const template = collectors[0];
    return assembleCollectorProfileDetail({
      ...template,
      id: `collector-${Date.now()}`,
      displayName: input.displayName,
      zone: input.zone,
    });
  },
};

export default collectorManagementServiceMock;
