export interface SettingsUserProfile {
  id: string;
  displayName: string;
  staffId: string;
  role: string;
  roleLabel: string;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  statusLabel?: string;
  phone: string;
  email: string;
  branch: string;
  region: string;
  zone: string;
  profileImageUrl?: string;
  assignedGroups: string[];
  assignedBorrowers: number;
  assignedPermissionIds: string[];
  delegatedPermissionIds: string[];
  lastLoginAt: string;
  activityHistory: SettingsUserActivityItem[];
  loginHistory: SettingsUserLoginItem[];
  deviceHistory: SettingsUserDeviceItem[];
  auditHistory: SettingsUserAuditItem[];
  performanceMetrics: SettingsUserPerformanceMetrics;
  approvalMetrics?: SettingsUserApprovalMetrics;
  registrationMetrics?: SettingsUserRegistrationMetrics;
}

export interface SettingsUserActivityItem {
  id: string;
  title: string;
  occurredAt: string;
}

export interface SettingsUserLoginItem {
  id: string;
  occurredAt: string;
  deviceLabel: string;
  locationLabel: string;
}

export interface SettingsUserDeviceItem {
  id: string;
  deviceLabel: string;
  lastSeenAt: string;
  platform: string;
}

export interface SettingsUserAuditItem {
  id: string;
  action: string;
  targetLabel: string;
  occurredAt: string;
}

export interface SettingsUserPerformanceMetrics {
  collectionRatePercent: number;
  dailyCollectedPesewas: number;
  weeklyCollectedPesewas: number;
  monthlyCollectedPesewas: number;
  borrowersManaged: number;
  expenseTotalPesewas?: number;
}

export interface SettingsUserApprovalMetrics {
  approvalsCount: number;
  rejectionsCount: number;
  pendingQueueCount: number;
}

export interface SettingsUserRegistrationMetrics {
  registrationsCompleted: number;
  pendingRegistrations: number;
}

export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  category: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissionIds: string[];
  isSystem: boolean;
  userCount: number;
}

export interface CreateRoleInput {
  name: string;
  description: string;
  permissionIds: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissionIds?: string[];
}
