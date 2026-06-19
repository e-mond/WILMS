export interface GroupFormationConfig {
  minGroupSize: number;
  maxGroupSize: number;
}

export interface ApprovedBorrowerFormationRecord {
  borrowerId: string;
  fullName: string;
  community: string;
  approvedAt: string;
}

export interface AutoGroupCreationResult {
  created: boolean;
  groupId?: string;
  groupSystemId?: string;
  displayName?: string;
  memberCount?: number;
  message: string;
}

export interface GroupFormationStatus {
  community: string;
  approvedCount: number;
  minGroupSize: number;
  maxGroupSize: number;
  readyForFormation: boolean;
}
