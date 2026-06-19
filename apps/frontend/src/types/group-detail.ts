import type { BorrowerStatus } from '@/types/borrower';
import type {
  GroupActivity,
  GroupMember,
  GroupMemberLoanStatus,
  GroupMemberRole,
  GroupRiskHistoryEntry,
  GroupRiskLevel,
  GroupSummary,
} from '@/types/group';

export const GROUP_STATUS = {
  ACTIVE: 'ACTIVE',
  AT_RISK: 'AT_RISK',
  FLAGGED: 'FLAGGED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type GroupStatus = (typeof GROUP_STATUS)[keyof typeof GROUP_STATUS];

export interface GroupMemberDetail extends GroupMember {
  phone: string;
  borrowerStatus: BorrowerStatus;
  outstandingPesewas: number;
  lastPaymentDate: string | null;
}

export interface GroupLeaderProfile {
  borrowerId: string;
  fullName: string;
  phone: string;
  email?: string;
  nationalId: string;
  address: string;
  gpsAddress: string;
  memberSince: string;
  status: BorrowerStatus;
  photoUrl?: string | null;
}

export interface GroupCollectorAssignment {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  zone: string;
  assignedGroupCount: number;
  collectionRatePercent: number;
  lastActiveAt: string;
  photoUrl?: string | null;
}

export interface GroupCycleInfo {
  label: string;
  number: number;
  startedAt: string;
}

export interface GroupDetail extends GroupSummary {
  status: GroupStatus;
  statusLabel: string;
  leaderName: string;
  leader: GroupLeaderProfile;
  collector: GroupCollectorAssignment;
  registrationOfficerName: string;
  cycle: GroupCycleInfo;
  activeLoanCount: number;
  repaymentPerformancePercent: number;
  outstandingPesewas: number;
  members: GroupMemberDetail[];
  riskHistory: GroupRiskHistoryEntry[];
  recentActivity: GroupActivity[];
}

export interface FlagGroupInput {
  groupId: string;
  reason: string;
  actorUserId: string;
}

export interface ReassignGroupCollectorInput {
  groupId: string;
  collectorId: string;
  reason: string;
  actorUserId: string;
}

export interface GroupMembershipChangeInput {
  groupId: string;
  borrowerId: string;
  reason: string;
  actorUserId: string;
}

export interface AddGroupMemberInput {
  groupId: string;
  fullName: string;
  phone: string;
  reason: string;
  actorUserId: string;
}

export interface TransferGroupMemberInput extends GroupMembershipChangeInput {
  targetGroupId: string;
}

export interface UpdateGroupDisplayNameInput {
  groupId: string;
  displayName: string;
  actorUserId: string;
}

export type ReplaceGroupLeaderInput = GroupMembershipChangeInput;

export interface RecordGroupAdjustmentInput {
  groupId: string;
  reason: string;
  actorUserId: string;
}

export interface GroupMembershipChangeResult {
  allowed: boolean;
  message: string;
  requiresApproval: boolean;
}

export type { GroupMemberLoanStatus, GroupMemberRole, GroupRiskLevel };
