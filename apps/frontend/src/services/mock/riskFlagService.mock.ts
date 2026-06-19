import type { RiskFlagDetail } from '@/types/risk-flag';
import type { IRiskFlagService } from '@/types/services';
import { getRiskFlagsDemoDataset } from '@/services/mock/factories/risk-flags-demo.factory';
import { simulateDelay } from '@/services/mock/delay';
import { buildDefaultFlagTimeline } from '@/utils/risk-flag-list';

const riskFlagServiceMock: IRiskFlagService = {
  async listRiskFlags() {
    await simulateDelay();
    return getRiskFlagsDemoDataset();
  },

  async getRiskFlag(id: string) {
    await simulateDelay();

    const { flags } = getRiskFlagsDemoDataset();
    const flag = flags.find((entry) => entry.id === id);

    if (!flag) {
      throw new Error('Risk flag not found');
    }

    const detail: RiskFlagDetail = {
      ...flag,
      activeMembers: flag.activeMembers ?? (flag.entityType === 'GROUP' ? 9 : undefined),
      totalMembers: flag.totalMembers ?? (flag.entityType === 'GROUP' ? 16 : undefined),
      timeline: buildDefaultFlagTimeline(flag),
    };

    return detail;
  },
};

export default riskFlagServiceMock;
