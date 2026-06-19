import { USER_ROLE } from '@/constants/roles';
import type { SettingsUserRecord } from '@/types/settings';

const ROLE_PRESENTATION: Record<
  string,
  Pick<SettingsUserRecord, 'roleLabel' | 'roleTone'>
> = {
  [USER_ROLE.SUPER_ADMIN]: { roleLabel: 'Super Admin', roleTone: 'gold' },
  [USER_ROLE.APPROVER]: { roleLabel: 'Approver', roleTone: 'primary' },
  [USER_ROLE.COLLECTOR]: { roleLabel: 'Collector', roleTone: 'info' },
  [USER_ROLE.REGISTRATION_OFFICER]: { roleLabel: 'Registration Officer', roleTone: 'primary' },
  [USER_ROLE.AUDITOR]: { roleLabel: 'Auditor', roleTone: 'muted' },
};

export function resolveSettingsUserPresentation(
  role: string,
  roleLabelOverride?: string,
): Pick<SettingsUserRecord, 'roleLabel' | 'roleTone'> {
  const base = ROLE_PRESENTATION[role] ?? { roleLabel: role, roleTone: 'muted' as const };

  if (roleLabelOverride) {
    return { ...base, roleLabel: roleLabelOverride };
  }

  return base;
}

export function formatSettingsUserStatus(status: SettingsUserRecord['status']): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'INVITED':
      return 'Invited';
    case 'SUSPENDED':
      return 'Suspended';
    default:
      return status;
  }
}
