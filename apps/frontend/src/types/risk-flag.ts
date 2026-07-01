export const FLAG_ENTITY_TYPE = {
  BORROWER: 'BORROWER',
  GROUP: 'GROUP',
  COLLECTOR: 'COLLECTOR',
  LOAN_POOL: 'LOAN_POOL',
  APPLICATION: 'APPLICATION',
} as const;

export type FlagEntityType = (typeof FLAG_ENTITY_TYPE)[keyof typeof FLAG_ENTITY_TYPE];

export const FLAG_TYPE = {
  MISSED_PAYMENT: 'MISSED_PAYMENT',
  DEFAULT: 'DEFAULT',
  FRAUD_SUSPICION: 'FRAUD_SUSPICION',
  DUPLICATE_ID: 'DUPLICATE_ID',
  BLACKLISTED: 'BLACKLISTED',
} as const;

export type FlagType = (typeof FLAG_TYPE)[keyof typeof FLAG_TYPE];

export const FLAG_STATUS = {
  OPEN: 'OPEN',
  UNDER_REVIEW: 'UNDER_REVIEW',
  CRITICAL: 'CRITICAL',
  RESOLVED: 'RESOLVED',
} as const;

export type FlagStatus = (typeof FLAG_STATUS)[keyof typeof FLAG_STATUS];

export interface RiskFlagSummary {
  id: string;
  entityId: string;
  entityName: string;
  entityType: FlagEntityType;
  groupName?: string;
  flagType: FlagType;
  community: string;
  officerName: string;
  raisedAt: string;
  arrearsPesewas: number;
  status: FlagStatus;
  weeksOverdue?: number;
  activeMembers?: number;
  totalMembers?: number;
}

export interface RiskFlagListSummary {
  openFlags: number;
  blacklisted: number;
  outstandingArrearsPesewas: number;
  highRiskBorrowers: number;
}

export interface FlagTypeBreakdown {
  flagType: FlagType;
  label: string;
  count: number;
}

export interface FlagTimelineEvent {
  id: string;
  message: string;
  recordedAt: string;
}

export interface RecentBlacklisting {
  id: string;
  name: string;
  reason: string;
  blacklistedAt: string;
}

export interface RiskFlagListResponse {
  generatedAt: string;
  summary: RiskFlagListSummary;
  flags: RiskFlagSummary[];
  typeBreakdown: FlagTypeBreakdown[];
  recentBlacklists: RecentBlacklisting[];
}

export interface RiskFlagDetail extends RiskFlagSummary {
  activeMembers?: number;
  totalMembers?: number;
  timeline: FlagTimelineEvent[];
}

export interface CreateRiskFlagInput {
  entityId: string;
  entityName: string;
  entityType: FlagEntityType;
  flagType: FlagType;
  community: string;
  reason?: string;
  officerName?: string;
  arrearsPesewas?: number;
}

export interface ResolveRiskFlagInput {
  reason?: string;
}

export interface AssignRiskFlagInput {
  assignedToUserId: string;
}
