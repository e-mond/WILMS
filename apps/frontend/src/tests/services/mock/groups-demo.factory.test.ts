import { beforeEach, describe, expect, it } from 'vitest';
import {
  GROUPS_REFERENCE_COUNT,
  GROUPS_REFERENCE_FEATURED_GROUP,
  GROUPS_REFERENCE_RISK_DISTRIBUTION,
  GROUPS_REFERENCE_SUMMARY,
} from '@/constants/groups-reference-scale';
import {
  generateGroupsDemoDataset,
  getGroupsDemoSourceById,
  groupsDatasetMatchesReference,
  resetGroupsDemoDataset,
} from '@/services/mock/factories/groups-demo.factory';
import groupServiceMock from '@/services/mock/groupService.mock';

describe('groups-demo.factory', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
  });

  it('generates 148 groups at reference scale', () => {
    const dataset = generateGroupsDemoDataset(42);

    expect(dataset.groups).toHaveLength(GROUPS_REFERENCE_COUNT);
    expect(groupsDatasetMatchesReference(dataset)).toBe(true);
  });

  it('pins GRP-0041 Adwoa Nhyira Group from the reference image', () => {
    const dataset = generateGroupsDemoDataset(42);
    const featured = dataset.groups.find((group) => group.id === GROUPS_REFERENCE_FEATURED_GROUP.id);

    expect(featured).toMatchObject({
      id: 'GRP-0041',
      name: 'Adwoa Nhyira Group',
      community: 'Madina, Accra',
      memberCount: 14,
      activeMemberCount: 12,
      collectionRatePercent: 82,
    });
    expect(dataset.groups[0]?.id).toBe('GRP-0041');
  });

  it('matches reference KPI summary values', () => {
    const dataset = generateGroupsDemoDataset(42);

    expect(dataset.summary).toEqual({
      activeGroups: GROUPS_REFERENCE_SUMMARY.activeGroups,
      totalMembers: GROUPS_REFERENCE_SUMMARY.totalMembers,
      flaggedOrSuspended: GROUPS_REFERENCE_SUMMARY.flaggedOrSuspended,
      avgCollectionRatePercent: GROUPS_REFERENCE_SUMMARY.avgCollectionRatePercent,
    });
  });

  it('matches reference risk distribution', () => {
    const dataset = generateGroupsDemoDataset(42);

    expect(dataset.riskDistribution).toEqual(GROUPS_REFERENCE_RISK_DISTRIBUTION);
  });

  it('includes recent activity timestamps for relative display', () => {
    const dataset = generateGroupsDemoDataset(42);

    expect(dataset.recentActivity.every((entry) => entry.recordedAt)).toBe(true);
    expect(dataset.recentActivity.some((entry) => entry.message.includes('GRP-0041'))).toBe(true);
  });

  it('exposes source records for profile lookup', () => {
    generateGroupsDemoDataset(42);

    expect(getGroupsDemoSourceById('GRP-0041')?.leaderName).toBe('Adwoa Nhyira');
  });
});

describe('groupService.mock', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
  });

  it('serves reference-scale group list from demo factory', async () => {
    const response = await groupServiceMock.listGroups();

    expect(response.groups).toHaveLength(148);
    expect(response.summary.activeGroups).toBe(148);
    expect(response.summary.totalMembers).toBe(2416);
    expect(response.riskDistribution.flagged).toBe(11);
  });
});
