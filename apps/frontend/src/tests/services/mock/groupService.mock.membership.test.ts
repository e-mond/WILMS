import { beforeEach, describe, expect, it } from 'vitest';
import { API_ERROR_CODE } from '@/types/api';
import { GROUP_MEMBER_LOAN_STATUS, GROUP_MEMBER_ROLE } from '@/types/group';
import { generateGroupsDemoDataset, resetGroupsDemoDataset } from '@/services/mock/factories/groups-demo.factory';
import groupServiceMock, { resetGroupDetailCache } from '@/services/mock/groupService.mock';
import { resetSystemSettingsStore } from '@/services/mock/settings.store';
import settingsServiceMock from '@/services/mock/settingsService.mock';

describe('groupService.mock membership size rules', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
    resetGroupDetailCache();
    resetSystemSettingsStore();
    generateGroupsDemoDataset(42);
  });

  it('blocks adding members when a group is at max size', async () => {
    const limits = await settingsServiceMock.getSettings();
    const group = await groupServiceMock.getGroup('GRP-0041');
    const membersToAdd = limits.maxGroupSize - group.members.length;

    for (let index = 0; index < membersToAdd; index += 1) {
      await groupServiceMock.addMember({
        groupId: 'GRP-0041',
        fullName: `Added Member ${index + 1}`,
        phone: '+233200000000',
        reason: 'Capacity test',
        actorUserId: 'user-super-admin',
      });
    }

    await expect(
      groupServiceMock.addMember({
        groupId: 'GRP-0041',
        fullName: 'Overflow Member',
        phone: '+233200000001',
        reason: 'Capacity test',
        actorUserId: 'user-super-admin',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: API_ERROR_CODE.VALIDATION,
      message: `Groups cannot exceed ${limits.maxGroupSize} members.`,
    });
  });

  it('blocks transfers that would leave the source group below minimum size', async () => {
    const limits = await settingsServiceMock.getSettings();

    for (let index = 0; index < limits.minGroupSize - 3; index += 1) {
      await groupServiceMock.addMember({
        groupId: 'GRP-0041',
        fullName: `Threshold Member ${index + 1}`,
        phone: '+233200000010',
        reason: 'Reach minimum size',
        actorUserId: 'user-super-admin',
      });
    }

    const sourceGroup = await groupServiceMock.getGroup('GRP-0041');
    const transferableMember = sourceGroup.members.find(
      (member) =>
        member.role !== GROUP_MEMBER_ROLE.LEADER &&
        member.loanStatus === GROUP_MEMBER_LOAN_STATUS.NONE,
    );

    expect(transferableMember).toBeDefined();
    expect(sourceGroup.members.length).toBe(limits.minGroupSize);

    await expect(
      groupServiceMock.transferMember({
        groupId: 'GRP-0041',
        targetGroupId: 'GRP-0042',
        borrowerId: transferableMember!.borrowerId,
        reason: 'Transfer below minimum',
        actorUserId: 'user-super-admin',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: API_ERROR_CODE.VALIDATION,
      message: `Groups must retain at least ${limits.minGroupSize} members.`,
    });
  });

  it('blocks transfers that would exceed the target group max size', async () => {
    const limits = await settingsServiceMock.getSettings();
    let targetGroup = await groupServiceMock.getGroup('GRP-0042');

    while (targetGroup.members.length < limits.maxGroupSize) {
      await groupServiceMock.addMember({
        groupId: 'GRP-0042',
        fullName: `Target Fill Member ${targetGroup.members.length + 1}`,
        phone: '+233200000020',
        reason: 'Reach maximum size',
        actorUserId: 'user-super-admin',
      });
      targetGroup = await groupServiceMock.getGroup('GRP-0042');
    }

    let sourceGroup = await groupServiceMock.getGroup('GRP-0041');

    while (sourceGroup.members.length < limits.minGroupSize) {
      await groupServiceMock.addMember({
        groupId: 'GRP-0041',
        fullName: `Source Fill Member ${sourceGroup.members.length + 1}`,
        phone: '+233200000030',
        reason: 'Reach minimum size',
        actorUserId: 'user-super-admin',
      });
      sourceGroup = await groupServiceMock.getGroup('GRP-0041');
    }

    await groupServiceMock.addMember({
      groupId: 'GRP-0041',
      fullName: 'Transfer Candidate',
      phone: '+233200000021',
      reason: 'Transfer candidate',
      actorUserId: 'user-super-admin',
    });

    sourceGroup = await groupServiceMock.getGroup('GRP-0041');
    const transferableMember = sourceGroup.members.find(
      (member) => member.fullName === 'Transfer Candidate',
    );

    expect(transferableMember).toBeDefined();
    expect(targetGroup.members.length).toBeGreaterThanOrEqual(limits.maxGroupSize);
    expect(sourceGroup.members.length).toBeGreaterThan(limits.minGroupSize);

    await expect(
      groupServiceMock.transferMember({
        groupId: 'GRP-0041',
        targetGroupId: 'GRP-0042',
        borrowerId: transferableMember!.borrowerId,
        reason: 'Transfer above maximum',
        actorUserId: 'user-super-admin',
      }),
    ).rejects.toMatchObject({
      status: 422,
      code: API_ERROR_CODE.VALIDATION,
      message: `Groups cannot exceed ${limits.maxGroupSize} members.`,
    });
  });
});
