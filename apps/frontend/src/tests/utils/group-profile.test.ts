import { describe, expect, it } from 'vitest';
import { GROUP_RISK_LEVEL, type GroupSourceRecord } from '@/types/group';
import { buildGroupSummaries } from '@/utils/group-profile';

const SAMPLE_SOURCES: GroupSourceRecord[] = [
  {
    id: 'GRP-0038',
    name: 'Akosua Mbrenhoma',
    community: 'Tema',
    officerName: 'Yaw Darko',
    leaderName: 'Akosua Mbrenhoma',
    formedAt: '2023-11-05',
    memberCount: 22,
    activeMemberCount: 22,
    disbursedPesewas: 560_000,
    collectedPesewas: 498_000,
    collectionRatePercent: 88.9,
  },
  {
    id: 'GRP-0041',
    name: 'Adwoa Nhyira Group',
    community: 'Madina',
    officerName: 'Abena Owusu',
    leaderName: 'Adwoa Nhyira',
    formedAt: '2024-03-12',
    memberCount: 18,
    activeMemberCount: 16,
    disbursedPesewas: 420_000,
    collectedPesewas: 318_000,
    collectionRatePercent: 75.7,
  },
  {
    id: 'GRP-0012',
    name: 'Fiifi Circle',
    community: 'Cape Coast',
    officerName: 'Kofi Mensah',
    leaderName: 'Fiifi Ansah',
    formedAt: '2021-08-14',
    memberCount: 14,
    activeMemberCount: 12,
    disbursedPesewas: 280_000,
    collectedPesewas: 196_000,
    collectionRatePercent: 70,
    defaultedMemberCount: 2,
  },
  {
    id: 'GRP-0018',
    name: 'Onyame Bekyere',
    community: 'Accra New Town',
    officerName: 'Yaw Darko',
    leaderName: 'Grace Osei',
    formedAt: '2022-01-20',
    memberCount: 16,
    activeMemberCount: 9,
    disbursedPesewas: 640_000,
    collectedPesewas: 320_000,
    collectionRatePercent: 50,
    defaultedMemberCount: 3,
  },
  {
    id: 'GRP-0003',
    name: 'Suspended Group',
    community: 'Kumasi',
    officerName: 'Kofi Mensah',
    leaderName: 'Ama Serwaa',
    formedAt: '2020-12-01',
    memberCount: 10,
    activeMemberCount: 0,
    disbursedPesewas: 200_000,
    collectedPesewas: 140_000,
    collectionRatePercent: 70,
    isManuallySuspended: true,
  },
];

describe('buildGroupSummaries', () => {
  it('derives risk levels from collection and participation metrics', () => {
    const summaries = buildGroupSummaries(SAMPLE_SOURCES);
    const byId = Object.fromEntries(summaries.map((group) => [group.id, group]));

    expect(byId['GRP-0038']?.riskLevel).toBe(GROUP_RISK_LEVEL.LOW_RISK);
    expect(byId['GRP-0041']?.riskLevel).toBe(GROUP_RISK_LEVEL.AT_RISK);
    expect(byId['GRP-0012']?.riskLevel).toBe(GROUP_RISK_LEVEL.FLAGGED);
    expect(byId['GRP-0018']?.riskLevel).toBe(GROUP_RISK_LEVEL.SUSPENDED);
    expect(byId['GRP-0003']?.riskLevel).toBe(GROUP_RISK_LEVEL.SUSPENDED);
  });
});
