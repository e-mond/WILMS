import { ROLE_LABELS, type UserRole } from '@/constants/roles';

export function getRoleLabel(role: string | null | undefined): string {
  if (!role) {
    return 'User';
  }

  return ROLE_LABELS[role as UserRole] ?? role.replace(/_/g, ' ');
}
