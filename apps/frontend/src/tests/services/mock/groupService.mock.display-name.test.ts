import { beforeEach, describe, expect, it } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { GROUP_MEMBER_ROLE } from '@/types/group';
import {
  generateGroupsDemoDataset,
  resetGroupsDemoDataset,
  updateGroupSourceDisplayName,
} from '@/services/mock/factories/groups-demo.factory';
import groupServiceMock, { resetGroupDetailCache } from '@/services/mock/groupService.mock';
import { resetSystemSettingsStore } from '@/services/mock/settings.store';

describe('groupService.mock display name and leader permissions', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
    resetGroupDetailCache();
    resetSystemSettingsStore();
    generateGroupsDemoDataset(42);
  });

  it('updates display name while preserving groupSystemId', async () => {
    const updated = await groupServiceMock.updateDisplayName({
      groupId: 'GRP-0041',
      displayName: 'Sunrise Women Group',
      actorUserId: 'user-super-admin',
    });

    expect(updated.displayName).toBe('Sunrise Women Group');
    expect(updated.name).toBe('Sunrise Women Group');
    expect(updated.groupSystemId).toBeTruthy();
    expect(updateGroupSourceDisplayName('GRP-0041', 'Sunrise Women Group')?.displayName).toBe(
      'Sunrise Women Group',
    );
  });

  it('blocks approvers from replacing an existing leader', async () => {
    const group = await groupServiceMock.getGroup('GRP-0041');
    const replacement = group.members.find((member) => member.role !== GROUP_MEMBER_ROLE.LEADER);

    expect(replacement).toBeDefined();

    await expect(
      groupServiceMock.replaceLeader({
        groupId: 'GRP-0041',
        borrowerId: replacement!.borrowerId,
        reason: 'Leadership change',
        actorUserId: 'user-approver',
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: API_ERROR_CODE.UNAUTHORIZED,
    });
  });

  it('allows collectors to replace an existing leader', async () => {
    const group = await groupServiceMock.getGroup('GRP-0041');
    const replacement = group.members.find((member) => member.role !== GROUP_MEMBER_ROLE.LEADER);

    expect(replacement).toBeDefined();

    const updated = await groupServiceMock.replaceLeader({
      groupId: 'GRP-0041',
      borrowerId: replacement!.borrowerId,
      reason: 'Leadership change',
      actorUserId: 'user-collector',
    });

    expect(
      updated.members.find((member) => member.borrowerId === replacement!.borrowerId)?.role,
    ).toBe(GROUP_MEMBER_ROLE.LEADER);
  });
});
