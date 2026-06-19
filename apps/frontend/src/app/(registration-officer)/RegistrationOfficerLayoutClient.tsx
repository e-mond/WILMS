'use client';

import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { USER_ROLE } from '@/constants/roles';
import { RegistrationOfficerShell } from '@/layouts/RegistrationOfficerShell';

export function RegistrationOfficerLayoutClient({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRole={USER_ROLE.REGISTRATION_OFFICER}>
      <RegistrationOfficerShell>{children}</RegistrationOfficerShell>
    </RoleGuard>
  );
}
