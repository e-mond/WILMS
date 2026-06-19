export type GroupRiskLevel = 'LOW_RISK' | 'AT_RISK' | 'FLAGGED' | 'SUSPENDED';

export interface GroupRiskRecord {
  groupName: string;
  riskLevel: GroupRiskLevel;
}

export const MOCK_GROUP_RISK: GroupRiskRecord[] = [
  { groupName: 'Sunrise Women', riskLevel: 'LOW_RISK' },
  { groupName: 'Hope Circle', riskLevel: 'LOW_RISK' },
  { groupName: 'Grace Market Women', riskLevel: 'LOW_RISK' },
  { groupName: 'Tema Traders', riskLevel: 'LOW_RISK' },
  { groupName: 'Osu Artisans', riskLevel: 'LOW_RISK' },
  { groupName: 'Madina Weavers', riskLevel: 'LOW_RISK' },
  { groupName: 'Cantonments Circle', riskLevel: 'AT_RISK' },
  { groupName: 'Unassigned', riskLevel: 'AT_RISK' },
  { groupName: 'Labadi Enterprise', riskLevel: 'AT_RISK' },
  { groupName: 'Ashaiman Collective', riskLevel: 'FLAGGED' },
  { groupName: 'Kumasi Exporters', riskLevel: 'FLAGGED' },
  { groupName: 'Suspended Group', riskLevel: 'SUSPENDED' },
];
