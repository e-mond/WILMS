import { USER_ROLE, type UserRole } from '@/constants/roles';
import { PERMISSION, type PermissionId } from '@/constants/permissions';
import type { UserPermissionOverride } from '@/types/rbac';
import { ROLE_DEFINITIONS } from '@/constants/rbac-roles';
import { getUserPermissionOverrides } from '@/lib/rbac/user-permission-overrides';

/** Maps application role enum to RBAC role record id. */
export const USER_ROLE_TO_RBAC_ROLE_ID: Record<UserRole, string> = {
  [USER_ROLE.SUPER_ADMIN]: 'role-super-admin',
  [USER_ROLE.COLLECTOR]: 'role-collector',
  [USER_ROLE.REGISTRATION_OFFICER]: 'role-registration-officer',
  [USER_ROLE.APPROVER]: 'role-approver',
  [USER_ROLE.AUDITOR]: 'role-auditor',
};

export function getRolePermissionIds(roleId: string): PermissionId[] {
  const role = ROLE_DEFINITIONS.find((entry) => entry.id === roleId);
  return (role?.permissionIds ?? []) as PermissionId[];
}

export function resolveUserPermissionIds(
  userId: string,
  role: UserRole,
  overrides: UserPermissionOverride[] = getUserPermissionOverrides(userId),
): Set<PermissionId> {
  const roleId = USER_ROLE_TO_RBAC_ROLE_ID[role];
  const base = new Set(getRolePermissionIds(roleId));

  for (const override of overrides) {
    if (override.granted) {
      base.add(override.permissionId as PermissionId);
    } else {
      base.delete(override.permissionId as PermissionId);
    }
  }

  return base;
}

/** Route prefixes → any one of these permissions grants access. */
export const ROUTE_PERMISSION_REQUIREMENTS: { prefix: string; permissions: PermissionId[] }[] = [
  { prefix: '/dashboard', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_REPORTS] },
  /** Platform ops control centre — distinct from executive /dashboard. */
  { prefix: '/ops', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS] },
  { prefix: '/borrowers', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_ASSIGNED_BORROWERS, PERMISSION.REGISTER_BORROWERS] },
  { prefix: '/loan-pools', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_FINANCIAL_REPORTS] },
  { prefix: '/loans', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.APPROVE_LOANS, PERMISSION.VIEW_FINANCIAL_REPORTS] },
  { prefix: '/collectors', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_ALL_COLLECTORS] },
  { prefix: '/groups', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.MANAGE_GROUPS] },
  { prefix: '/risk-flags', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.REVIEW_RISK_FLAGS] },
  { prefix: '/expenses', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.MANAGE_EXPENSES] },
  { prefix: '/communication-center', permissions: [PERMISSION.MANAGE_COMMUNICATIONS, PERMISSION.VIEW_COMMUNICATION_ANALYTICS] },
  { prefix: '/reports', permissions: [PERMISSION.VIEW_REPORTS, PERMISSION.VIEW_AUDIT_LOG, PERMISSION.EXPORT_REPORTS] },
  { prefix: '/adjustments', permissions: [PERMISSION.ACCESS_ADMIN_PORTAL] },
  { prefix: '/settings', permissions: [PERMISSION.MANAGE_SYSTEM_SETTINGS, PERMISSION.MANAGE_USERS] },
  { prefix: '/collector', permissions: [PERMISSION.ACCESS_COLLECTOR_PORTAL] },
  { prefix: '/officer', permissions: [PERMISSION.ACCESS_REGISTRATION_PORTAL] },
  { prefix: '/approver', permissions: [PERMISSION.ACCESS_APPROVER_PORTAL] },
  { prefix: '/auditor', permissions: [PERMISSION.ACCESS_AUDITOR_PORTAL] },
];

export function canAccessPathWithPermissions(
  permissionIds: Set<PermissionId>,
  pathname: string,
): boolean {
  if (pathname === '/') {
    return true;
  }

  const match = ROUTE_PERMISSION_REQUIREMENTS.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!match) {
    return false;
  }

  return match.permissions.some((permission) => permissionIds.has(permission));
}

export function getPortalHomePath(role: UserRole): string {
  switch (role) {
    case USER_ROLE.COLLECTOR:
      return '/collector/dashboard';
    case USER_ROLE.REGISTRATION_OFFICER:
      return '/officer/register';
    case USER_ROLE.APPROVER:
      return '/approver/pending';
    case USER_ROLE.AUDITOR:
      return '/auditor/reports';
    case USER_ROLE.SUPER_ADMIN:
    default:
      return '/dashboard';
  }
}

/** Nav item href → required permission (any match shows item). */
export const NAV_ITEM_PERMISSIONS: Record<string, PermissionId[]> = {
  '/dashboard': [PERMISSION.ACCESS_ADMIN_PORTAL],
  '/ops': [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.MANAGE_SYSTEM_SETTINGS],
  '/borrowers': [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_ASSIGNED_BORROWERS],
  '/loan-pools': [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.VIEW_FINANCIAL_REPORTS],
  '/borrowers?status=PENDING': [PERMISSION.REVIEW_APPLICATIONS, PERMISSION.ACCESS_ADMIN_PORTAL],
  '/loans': [PERMISSION.ACCESS_ADMIN_PORTAL, PERMISSION.APPROVE_LOANS],
  '/reports/daily-collection': [PERMISSION.VIEW_REPORTS, PERMISSION.RECORD_COLLECTIONS],
  '/collectors': [PERMISSION.VIEW_ALL_COLLECTORS],
  '/groups': [PERMISSION.MANAGE_GROUPS, PERMISSION.ACCESS_ADMIN_PORTAL],
  '/risk-flags': [PERMISSION.REVIEW_RISK_FLAGS, PERMISSION.ACCESS_ADMIN_PORTAL],
  '/expenses': [PERMISSION.MANAGE_EXPENSES, PERMISSION.ACCESS_ADMIN_PORTAL],
  '/communication-center': [PERMISSION.MANAGE_COMMUNICATIONS, PERMISSION.VIEW_COMMUNICATION_ANALYTICS],
  '/reports/audit-log': [PERMISSION.VIEW_AUDIT_LOG],
  '/reports': [PERMISSION.VIEW_REPORTS, PERMISSION.EXPORT_REPORTS],
  '/settings': [PERMISSION.MANAGE_SYSTEM_SETTINGS],
  '/collector/dashboard': [PERMISSION.ACCESS_COLLECTOR_PORTAL],
  '/collector/admin-fee': [PERMISSION.RECORD_COLLECTIONS],
  '/collector/my-borrowers': [PERMISSION.VIEW_ASSIGNED_BORROWERS],
  '/collector/messages': [PERMISSION.ACCESS_COLLECTOR_PORTAL],
  '/collector/expenses': [PERMISSION.RECORD_EXPENSES],
  '/collector/reconciliation': [PERMISSION.RECORD_COLLECTIONS],
  '/collector/settings': [PERMISSION.ACCESS_COLLECTOR_PORTAL],
  '/officer/register': [PERMISSION.REGISTER_BORROWERS],
  '/officer/my-registrations': [PERMISSION.EDIT_PENDING_REGISTRATIONS, PERMISSION.REGISTER_BORROWERS],
  '/officer/settings': [PERMISSION.ACCESS_REGISTRATION_PORTAL],
  '/approver/pending': [PERMISSION.REVIEW_APPLICATIONS],
  '/approver/reviewed': [PERMISSION.REVIEW_APPLICATIONS],
  '/approver/settings': [PERMISSION.ACCESS_APPROVER_PORTAL],
  '/auditor/reports': [PERMISSION.ACCESS_AUDITOR_PORTAL, PERMISSION.VIEW_REPORTS],
  '/auditor/audit-log': [PERMISSION.VIEW_AUDIT_LOG],
  '/auditor/settings': [PERMISSION.ACCESS_AUDITOR_PORTAL],
};
