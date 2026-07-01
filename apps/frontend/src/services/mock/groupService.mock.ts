import type {
  AddGroupMemberInput,
  FlagGroupInput,
  GroupDetail,
  GroupMembershipChangeInput,
  GroupMembershipChangeResult,
  RecordGroupAdjustmentInput,
  ReassignGroupCollectorInput,
  ReplaceGroupLeaderInput,
  TransferGroupMemberInput,
  UpdateGroupDisplayNameInput,
} from '@/types/group-detail';
import type { CreateGroupInput } from '@/types/group';
import { MOCK_GROUP_MEMBERS } from '@/mocks/group-members';
import type { IGroupService } from '@/types/services';
import { ApiError, API_ERROR_CODE } from '@/types/api';
import { AUDIT_ACTION, AUDIT_TARGET_ENTITY } from '@/constants/audit';
import { DEMO_ACCOUNTS } from '@/constants/demo-accounts';
import type { UserRole } from '@/constants/roles';
import auditServiceMock from '@/services/mock/auditService.mock';
import settingsServiceMock from '@/services/mock/settingsService.mock';
import { simulateDelay } from '@/services/mock/delay';
import {
  getGroupsDemoDataset,
  getGroupsDemoSourceById,
  updateGroupSourceDisplayName,
} from '@/services/mock/factories/groups-demo.factory';
import { buildGroupDetail } from '@/services/mock/group-detail.builder';
import {
  GROUP_MEMBER_LOAN_STATUS,
  GROUP_MEMBER_ROLE,
} from '@/types/group';
import { getBorrowerRegistryEntry } from '@/services/mock/borrower-registry.store';
import { getSettingsUsersStore } from '@/services/mock/settings-users.store';
import {
  addGroupMember,
  markMemberRemoved,
  reassignGroupCollector,
  replaceGroupLeader,
  resetGroupMembershipStore,
} from '@/services/mock/group-membership.store';
import { canManageGroupLeader } from '@/utils/group-leader-permissions';

const groupDetailCache = new Map<string, GroupDetail>();
const flaggedGroups = new Set<string>();

async function findMember(groupId: string, borrowerId: string) {
  const members = MOCK_GROUP_MEMBERS[groupId] ?? [];
  const cachedMember = members.find((entry) => entry.borrowerId === borrowerId);

  if (cachedMember) {
    return cachedMember;
  }

  const group = await groupServiceMock.getGroup(groupId);
  return group.members.find((entry) => entry.borrowerId === borrowerId);
}

async function getGroupSizeLimits() {
  const settings = await settingsServiceMock.getSettings();
  return {
    minGroupSize: settings.minGroupSize,
    maxGroupSize: settings.maxGroupSize,
  };
}

async function validateGroupSizeBeforeAdd(groupId: string): Promise<GroupMembershipChangeResult> {
  const group = await groupServiceMock.getGroup(groupId);
  const limits = await getGroupSizeLimits();

  if (group.members.length >= limits.maxGroupSize) {
    return {
      allowed: false,
      message: `Groups cannot exceed ${limits.maxGroupSize} members.`,
      requiresApproval: false,
    };
  }

  return {
    allowed: true,
    message: 'Change is allowed. An audit record will be created.',
    requiresApproval: false,
  };
}

async function validateGroupSizeAfterRemoval(
  groupId: string,
): Promise<GroupMembershipChangeResult> {
  const group = await groupServiceMock.getGroup(groupId);
  const limits = await getGroupSizeLimits();
  const nextCount = group.members.length - 1;

  if (nextCount < limits.minGroupSize) {
    return {
      allowed: false,
      message: `Groups must retain at least ${limits.minGroupSize} members.`,
      requiresApproval: false,
    };
  }

  return {
    allowed: true,
    message: 'Change is allowed. An audit record will be created.',
    requiresApproval: false,
  };
}

async function validateActiveLoanBlock(
  input: GroupMembershipChangeInput,
): Promise<GroupMembershipChangeResult> {
  const member = await findMember(input.groupId, input.borrowerId);

  if (!member) {
    return {
      allowed: false,
      message: 'Member not found in this group.',
      requiresApproval: false,
    };
  }

  const registryEntry = getBorrowerRegistryEntry(input.borrowerId);
  const hasActiveLoan =
    member.loanStatus === GROUP_MEMBER_LOAN_STATUS.ACTIVE ||
    registryEntry?.hasActiveLoan === true;

  if (hasActiveLoan) {
    return {
      allowed: false,
      message: 'Members with active loans require Super Admin approval before removal or transfer.',
      requiresApproval: true,
    };
  }

  return {
    allowed: true,
    message: 'Change is allowed. An audit record will be created.',
    requiresApproval: false,
  };
}

function invalidateGroup(groupId: string): void {
  groupDetailCache.delete(groupId);
}

function resolveActorRole(actorUserId: string): UserRole | undefined {
  const demoAccount = DEMO_ACCOUNTS.find((account) => account.id === actorUserId);

  if (demoAccount) {
    return demoAccount.role;
  }

  const settingsUser = getSettingsUsersStore().find((entry) => entry.id === actorUserId);

  return settingsUser?.role as UserRole | undefined;
}

async function assertCanManageGroupLeader(input: {
  groupId: string;
  actorUserId: string;
}): Promise<void> {
  const group = await groupServiceMock.getGroup(input.groupId);
  const hasExistingLeader = group.members.some(
    (member) => member.role === GROUP_MEMBER_ROLE.LEADER,
  );
  const actorRole = resolveActorRole(input.actorUserId);

  if (!canManageGroupLeader(actorRole, hasExistingLeader)) {
    throw new ApiError(
      'You do not have permission to change the group leader.',
      API_ERROR_CODE.UNAUTHORIZED,
      403,
    );
  }
}

const groupServiceMock: IGroupService = {
  async listGroups() {
    await simulateDelay();
    return getGroupsDemoDataset();
  },

  async getGroup(id: string) {
    await simulateDelay();

    const source = getGroupsDemoSourceById(id);

    if (!source) {
      throw new ApiError('Group not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    if (!groupDetailCache.has(id)) {
      groupDetailCache.set(id, buildGroupDetail(source));
    }

    return groupDetailCache.get(id)!;
  },

  async createGroup(input: CreateGroupInput) {
    await simulateDelay();
    const detail = buildGroupDetail({
      id: `grp-${Date.now()}`,
      name: input.name,
      community: input.community,
      displayName: input.displayName ?? input.name,
      officerName: 'Super Admin',
      leaderName: '—',
      formedAt: new Date().toISOString().slice(0, 10),
      memberCount: input.memberBorrowerIds?.length ?? 0,
      activeMemberCount: input.memberBorrowerIds?.length ?? 0,
      disbursedPesewas: 0,
      collectedPesewas: 0,
      collectionRatePercent: 0,
    });
    groupDetailCache.set(detail.id, detail);
    return detail;
  },

  async flagGroup(input: FlagGroupInput) {
    await simulateDelay();

    flaggedGroups.add(input.groupId);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_FLAGGED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: input.reason,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async reassignCollector(input: ReassignGroupCollectorInput) {
    await simulateDelay();

    reassignGroupCollector(input.groupId, input.collectorId);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_COLLECTOR_REASSIGNED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: input.reason,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async validateMembershipRemoval(input: GroupMembershipChangeInput): Promise<GroupMembershipChangeResult> {
    await simulateDelay();

    const sizeValidation = await validateGroupSizeAfterRemoval(input.groupId);
    if (!sizeValidation.allowed) {
      return sizeValidation;
    }

    return validateActiveLoanBlock(input);
  },

  async removeMember(input: GroupMembershipChangeInput) {
    const validation = await this.validateMembershipRemoval(input);

    if (!validation.allowed) {
      throw new ApiError(validation.message, API_ERROR_CODE.VALIDATION, 422);
    }

    await simulateDelay();

    markMemberRemoved(input.groupId, input.borrowerId);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_MEMBER_REMOVED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: input.reason,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async addMember(input: AddGroupMemberInput) {
    await simulateDelay();

    const group = await this.getGroup(input.groupId);
    const limits = await getGroupSizeLimits();

    if (group.members.length >= limits.maxGroupSize) {
      throw new ApiError(
        `Groups cannot exceed ${limits.maxGroupSize} members.`,
        API_ERROR_CODE.VALIDATION,
        422,
      );
    }

    const borrowerId = `${input.groupId}-added-${Date.now()}`;

    addGroupMember(input.groupId, {
      borrowerId,
      fullName: input.fullName.trim(),
      role: GROUP_MEMBER_ROLE.MEMBER,
      loanStatus: GROUP_MEMBER_LOAN_STATUS.NONE,
      paymentConsistencyPercent: 100,
    });

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_MEMBER_ADDED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: `${input.reason.trim()} · ${input.fullName.trim()} (${input.phone.trim()})`,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async transferMember(input: TransferGroupMemberInput) {
    const validation = await validateActiveLoanBlock(input);

    if (!validation.allowed) {
      throw new ApiError(validation.message, API_ERROR_CODE.VALIDATION, 422);
    }

    const sourceSizeValidation = await validateGroupSizeAfterRemoval(input.groupId);

    if (!sourceSizeValidation.allowed) {
      throw new ApiError(sourceSizeValidation.message, API_ERROR_CODE.VALIDATION, 422);
    }

    const targetSizeValidation = await validateGroupSizeBeforeAdd(input.targetGroupId);

    if (!targetSizeValidation.allowed) {
      throw new ApiError(targetSizeValidation.message, API_ERROR_CODE.VALIDATION, 422);
    }

    const member = await findMember(input.groupId, input.borrowerId);

    if (!member) {
      throw new ApiError('Member not found in this group.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    const targetSource = getGroupsDemoSourceById(input.targetGroupId);

    if (!targetSource) {
      throw new ApiError('Target group not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    await simulateDelay();

    markMemberRemoved(input.groupId, input.borrowerId);
    addGroupMember(input.targetGroupId, {
      ...member,
      role: GROUP_MEMBER_ROLE.MEMBER,
    });

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_MEMBER_REMOVED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: `${input.reason.trim()} · transferred to ${input.targetGroupId}`,
    });

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_MEMBER_ADDED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.targetGroupId,
      actorId: input.actorUserId,
      reason: `${input.reason.trim()} · transferred from ${input.groupId}`,
    });

    invalidateGroup(input.groupId);
    invalidateGroup(input.targetGroupId);
    return this.getGroup(input.groupId);
  },

  async replaceLeader(input: ReplaceGroupLeaderInput) {
    await assertCanManageGroupLeader(input);

    const member = await findMember(input.groupId, input.borrowerId);

    if (!member) {
      throw new ApiError('Member not found in this group.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    if (member.role === GROUP_MEMBER_ROLE.LEADER) {
      throw new ApiError('Selected member is already the group leader.', API_ERROR_CODE.VALIDATION, 422);
    }

    await simulateDelay();

    replaceGroupLeader(input.groupId, input.borrowerId);

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_LEADER_REPLACED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: `${input.reason.trim()} · new leader ${member.fullName}`,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async updateDisplayName(input: UpdateGroupDisplayNameInput) {
    const trimmed = input.displayName.trim();

    if (!trimmed) {
      throw new ApiError('Display name is required.', API_ERROR_CODE.VALIDATION, 422);
    }

    const updatedSource = updateGroupSourceDisplayName(input.groupId, trimmed);

    if (!updatedSource) {
      throw new ApiError('Group not found.', API_ERROR_CODE.NOT_FOUND, 404);
    }

    await simulateDelay();

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_DISPLAY_NAME_UPDATED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: `Display name updated to ${trimmed}`,
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },

  async recordAdjustment(input: RecordGroupAdjustmentInput) {
    await simulateDelay();

    await auditServiceMock.createEntry({
      action: AUDIT_ACTION.GROUP_ADJUSTMENT_RECORDED,
      targetEntityType: AUDIT_TARGET_ENTITY.GROUP,
      targetEntityId: input.groupId,
      actorId: input.actorUserId,
      reason: input.reason.trim(),
    });

    invalidateGroup(input.groupId);
    return this.getGroup(input.groupId);
  },
};

export function resetGroupDetailCache(): void {
  groupDetailCache.clear();
  flaggedGroups.clear();
  resetGroupMembershipStore();
}

export default groupServiceMock;
