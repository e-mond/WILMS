import { MOCK_SYSTEM_SETTINGS } from '@/mocks/settings';
import settingsServiceMock from '@/services/mock/settingsService.mock';
import { simulateDelay } from '@/services/mock/delay';
import {
  getGroupFormationStatus,
  processApprovedBorrowerForGroupFormation,
} from '@/services/mock/group-formation.store';
import type {
  AutoGroupCreationResult,
  GroupFormationConfig,
  GroupFormationStatus,
} from '@/types/group-formation';
import type { IGroupFormationService } from '@/types/services';

async function resolveConfig(): Promise<GroupFormationConfig> {
  const settings = await settingsServiceMock.getSettings();

  return {
    minGroupSize: settings.minGroupSize,
    maxGroupSize: settings.maxGroupSize,
  };
}

const groupFormationServiceMock: IGroupFormationService = {
  async getConfig(): Promise<GroupFormationConfig> {
    await simulateDelay();
    return resolveConfig();
  },

  async getCommunityStatus(community: string): Promise<GroupFormationStatus> {
    await simulateDelay();
    const config = await resolveConfig();

    return getGroupFormationStatus(community, config);
  },

  async processApprovedBorrower(input: {
    borrowerId: string;
    fullName: string;
    community: string;
    approvedAt: string;
  }): Promise<AutoGroupCreationResult> {
    await simulateDelay();
    const config = await resolveConfig();

    return processApprovedBorrowerForGroupFormation({
      ...input,
      config,
    });
  },
};

export default groupFormationServiceMock;

export { MOCK_SYSTEM_SETTINGS };
