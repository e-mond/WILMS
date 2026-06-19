import { describe, expect, it } from 'vitest';
import { GROUP_RISK_LEVEL } from '@/types/group';
import { calculateGroupRiskLevel } from '@/utils/group-risk';

describe('calculateGroupRiskLevel', () => {
  it('returns low risk for strong collection and participation', () => {
    expect(
      calculateGroupRiskLevel({
        collectionRatePercent: 88.9,
        memberCount: 22,
        activeMemberCount: 22,
      }),
    ).toBe(GROUP_RISK_LEVEL.LOW_RISK);
  });

  it('returns at risk when collection rate is below 85%', () => {
    expect(
      calculateGroupRiskLevel({
        collectionRatePercent: 75.7,
        memberCount: 18,
        activeMemberCount: 16,
      }),
    ).toBe(GROUP_RISK_LEVEL.AT_RISK);
  });

  it('returns flagged when defaulted members are present', () => {
    expect(
      calculateGroupRiskLevel({
        collectionRatePercent: 70,
        memberCount: 14,
        activeMemberCount: 12,
        defaultedMemberCount: 2,
      }),
    ).toBe(GROUP_RISK_LEVEL.FLAGGED);
  });

  it('returns suspended for manual suspension or very low collection', () => {
    expect(
      calculateGroupRiskLevel({
        collectionRatePercent: 50,
        memberCount: 16,
        activeMemberCount: 9,
        defaultedMemberCount: 3,
      }),
    ).toBe(GROUP_RISK_LEVEL.SUSPENDED);

    expect(
      calculateGroupRiskLevel({
        collectionRatePercent: 70,
        memberCount: 10,
        activeMemberCount: 0,
        isManuallySuspended: true,
      }),
    ).toBe(GROUP_RISK_LEVEL.SUSPENDED);
  });
});
