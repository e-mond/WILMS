import type { RiskFlagDetail, CreateRiskFlagInput } from '@/types/risk-flag';
import { FLAG_STATUS } from '@/types/risk-flag';
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

  async createRiskFlag(input: CreateRiskFlagInput) {
    await simulateDelay();
    const detail: RiskFlagDetail = {
      id: `flag-${Date.now()}`,
      entityId: input.entityId,
      entityName: input.entityName,
      entityType: input.entityType,
      flagType: input.flagType,
      community: input.community,
      officerName: input.officerName ?? 'Super Admin',
      raisedAt: new Date().toISOString(),
      arrearsPesewas: input.arrearsPesewas ?? 0,
      status: FLAG_STATUS.OPEN,
      timeline: [],
    };
    return detail;
  },

  async escalateRiskFlag(id: string) {
    return this.getRiskFlag(id);
  },

  async resolveRiskFlag(id: string) {
    return this.getRiskFlag(id);
  },

  async assignRiskFlag(id: string) {
    return this.getRiskFlag(id);
  },
};

export default riskFlagServiceMock;
