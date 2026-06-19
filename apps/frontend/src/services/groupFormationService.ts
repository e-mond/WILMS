import type {
  AutoGroupCreationResult,
  GroupFormationConfig,
  GroupFormationStatus,
} from '@/types/group-formation';
import type { IGroupFormationService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const groupFormationService: IGroupFormationService = {
  getConfig(): Promise<GroupFormationConfig> {
    return apiClient.get<GroupFormationConfig>('/groups/formation/config');
  },

  getCommunityStatus(community: string): Promise<GroupFormationStatus> {
    return apiClient.get<GroupFormationStatus>(`/groups/formation/status/${encodeURIComponent(community)}`);
  },

  processApprovedBorrower(input: {
    borrowerId: string;
    fullName: string;
    community: string;
    approvedAt: string;
  }): Promise<AutoGroupCreationResult> {
    return apiClient.post<AutoGroupCreationResult>('/groups/formation/process-approval', input);
  },
};

export default groupFormationService;
