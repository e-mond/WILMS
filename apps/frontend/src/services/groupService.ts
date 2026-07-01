import type { GroupDetail, GroupListResponse, CreateGroupInput } from '@/types/group';
import type {
  AddGroupMemberInput,
  FlagGroupInput,
  GroupMembershipChangeInput,
  GroupMembershipChangeResult,
  RecordGroupAdjustmentInput,
  ReassignGroupCollectorInput,
  ReplaceGroupLeaderInput,
  TransferGroupMemberInput,
  UpdateGroupDisplayNameInput,
} from '@/types/group-detail';
import type { IGroupService } from '@/types/services';
import { apiClient } from '@/utils/apiClient';

const groupService: IGroupService = {
  listGroups(): Promise<GroupListResponse> {
    return apiClient.get<GroupListResponse>('/groups');
  },

  getGroup(id: string): Promise<GroupDetail> {
    return apiClient.get<GroupDetail>(`/groups/${id}`);
  },

  createGroup(input: CreateGroupInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>('/groups', input);
  },

  flagGroup(input: FlagGroupInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/flag`, input);
  },

  reassignCollector(input: ReassignGroupCollectorInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/reassign-collector`, input);
  },

  validateMembershipRemoval(
    input: GroupMembershipChangeInput,
  ): Promise<GroupMembershipChangeResult> {
    return apiClient.post<GroupMembershipChangeResult>(
      `/groups/${input.groupId}/validate-removal`,
      input,
    );
  },

  removeMember(input: GroupMembershipChangeInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/remove-member`, input);
  },

  addMember(input: AddGroupMemberInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/add-member`, input);
  },

  transferMember(input: TransferGroupMemberInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/transfer-member`, input);
  },

  replaceLeader(input: ReplaceGroupLeaderInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/replace-leader`, input);
  },

  updateDisplayName(input: UpdateGroupDisplayNameInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/display-name`, input);
  },

  recordAdjustment(input: RecordGroupAdjustmentInput): Promise<GroupDetail> {
    return apiClient.post<GroupDetail>(`/groups/${input.groupId}/record-adjustment`, input);
  },
};

export default groupService;
