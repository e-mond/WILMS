import { GROUP_RISK_LEVEL, type GroupRiskHistoryEntry } from '@/types/group';

export const MOCK_GROUP_RISK_HISTORY: Record<string, GroupRiskHistoryEntry[]> = {
  'GRP-0041': [
    {
      id: 'grh-0041-1',
      riskLevel: GROUP_RISK_LEVEL.AT_RISK,
      reason: 'Collection rate dropped below 85% after two missed weeks.',
      recordedAt: '2026-05-20T09:00:00.000Z',
    },
    {
      id: 'grh-0041-2',
      riskLevel: GROUP_RISK_LEVEL.LOW_RISK,
      reason: 'Group maintained 90%+ collection for three consecutive cycles.',
      recordedAt: '2026-03-01T09:00:00.000Z',
    },
  ],
  'GRP-0018': [
    {
      id: 'grh-0018-1',
      riskLevel: GROUP_RISK_LEVEL.SUSPENDED,
      reason: 'Collection rate below 60% and multiple defaulted members.',
      recordedAt: '2026-05-15T09:00:00.000Z',
    },
    {
      id: 'grh-0018-2',
      riskLevel: GROUP_RISK_LEVEL.FLAGGED,
      reason: 'Two members entered default status.',
      recordedAt: '2026-04-10T09:00:00.000Z',
    },
  ],
  'GRP-0012': [
    {
      id: 'grh-0012-1',
      riskLevel: GROUP_RISK_LEVEL.FLAGGED,
      reason: 'Defaulted members detected; joint liability review required.',
      recordedAt: '2026-05-01T09:00:00.000Z',
    },
  ],
};
