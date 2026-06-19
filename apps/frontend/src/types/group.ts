export const GROUP_RISK_LEVEL = {
  LOW_RISK: 'LOW_RISK',
  AT_RISK: 'AT_RISK',
  FLAGGED: 'FLAGGED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type GroupRiskLevel = (typeof GROUP_RISK_LEVEL)[keyof typeof GROUP_RISK_LEVEL];

export const GROUP_MEMBER_ROLE = {
  LEADER: 'LEADER',
  MEMBER: 'MEMBER',
} as const;

export type GroupMemberRole = (typeof GROUP_MEMBER_ROLE)[keyof typeof GROUP_MEMBER_ROLE];

export const GROUP_MEMBER_LOAN_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  DEFAULTED: 'DEFAULTED',
  NONE: 'NONE',
} as const;

export type GroupMemberLoanStatus =
  (typeof GROUP_MEMBER_LOAN_STATUS)[keyof typeof GROUP_MEMBER_LOAN_STATUS];

export interface GroupSourceRecord {
  id: string;
  name: string;
  groupSystemId?: string;
  displayName?: string;
  community: string;
  officerName: string;
  leaderName: string;
  formedAt: string;
  memberCount: number;
  activeMemberCount: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  defaultedMemberCount?: number;
  isManuallySuspended?: boolean;
}

export interface GroupMember {
  borrowerId: string;
  fullName: string;
  role: GroupMemberRole;
  loanStatus: GroupMemberLoanStatus;
  paymentConsistencyPercent: number;
  photoUrl?: string | null;
}

export interface GroupRiskHistoryEntry {
  id: string;
  riskLevel: GroupRiskLevel;
  reason: string;
  recordedAt: string;
}

export interface GroupSummary {
  id: string;
  name: string;
  groupSystemId: string;
  displayName: string;
  community: string;
  officerName: string;
  formedAt: string;
  memberCount: number;
  activeMemberCount: number;
  disbursedPesewas: number;
  collectedPesewas: number;
  collectionRatePercent: number;
  riskLevel: GroupRiskLevel;
}

export interface GroupListSummary {
  activeGroups: number;
  totalMembers: number;
  flaggedOrSuspended: number;
  avgCollectionRatePercent: number;
}

export interface GroupRiskDistribution {
  lowRisk: number;
  atRisk: number;
  flagged: number;
  suspended: number;
}

export interface GroupActivity {
  id: string;
  message: string;
  recordedAt: string;
}

export interface GroupListResponse {
  generatedAt: string;
  summary: GroupListSummary;
  riskDistribution: GroupRiskDistribution;
  groups: GroupSummary[];
  recentActivity: GroupActivity[];
}

export type { GroupDetail } from '@/types/group-detail';
