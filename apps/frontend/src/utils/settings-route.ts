import { USER_ROLE, type UserRole } from '@/constants/roles';

export function resolveSettingsHref(role: UserRole | null | undefined): string {
  switch (role) {
    case USER_ROLE.COLLECTOR:
      return '/collector/settings';
    case USER_ROLE.REGISTRATION_OFFICER:
      return '/officer/settings';
    case USER_ROLE.APPROVER:
      return '/approver/settings';
    case USER_ROLE.AUDITOR:
      return '/auditor/settings';
    case USER_ROLE.SUPER_ADMIN:
    default:
      return '/settings';
  }
}
