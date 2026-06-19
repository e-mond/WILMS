import {
  GROUP_RISK_COLLECTION_RATE,
  GROUP_RISK_PARTICIPATION_MIN_PERCENT,
} from '@/constants/group-risk';
import { GROUP_RISK_LEVEL, type GroupRiskLevel } from '@/types/group';

export interface GroupRiskCalculationInput {
  collectionRatePercent: number;
  memberCount: number;
  activeMemberCount: number;
  defaultedMemberCount?: number;
  isManuallySuspended?: boolean;
}

export function calculateMemberParticipationPercent(
  activeMemberCount: number,
  memberCount: number,
): number {
  if (memberCount === 0) {
    return 0;
  }

  return Math.round((activeMemberCount / memberCount) * 1000) / 10;
}

export function calculateGroupRiskLevel(input: GroupRiskCalculationInput): GroupRiskLevel {
  if (input.isManuallySuspended || input.activeMemberCount === 0) {
    return GROUP_RISK_LEVEL.SUSPENDED;
  }

  if (input.collectionRatePercent < GROUP_RISK_COLLECTION_RATE.SUSPENDED_MAX) {
    return GROUP_RISK_LEVEL.SUSPENDED;
  }

  const participationPercent = calculateMemberParticipationPercent(
    input.activeMemberCount,
    input.memberCount,
  );

  if (
    (input.defaultedMemberCount ?? 0) > 0 ||
    input.collectionRatePercent < GROUP_RISK_COLLECTION_RATE.AT_RISK_MIN
  ) {
    return GROUP_RISK_LEVEL.FLAGGED;
  }

  if (
    input.collectionRatePercent < GROUP_RISK_COLLECTION_RATE.LOW_RISK_MIN ||
    participationPercent < GROUP_RISK_PARTICIPATION_MIN_PERCENT
  ) {
    return GROUP_RISK_LEVEL.AT_RISK;
  }

  return GROUP_RISK_LEVEL.LOW_RISK;
}
