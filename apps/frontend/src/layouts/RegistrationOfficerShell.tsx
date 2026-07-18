'use client';

import type { ReactNode } from 'react';
import { ExecutiveThemeInitializer } from '@/components/layout/executive';
import { REGISTRATION_OFFICER_NAV } from '@/constants/navigation';
import { OfficeShell } from '@/layouts/OfficeShell';

interface RegistrationOfficerShellProps {
  children: ReactNode;
}

export function RegistrationOfficerShell({ children }: RegistrationOfficerShellProps) {
  return (
    <OfficeShell
      shellId="registration-officer"
      navItems={REGISTRATION_OFFICER_NAV}
      navAriaLabel="Registration Officer"
      operationalMobileNav
      brandTitle="WILMS Registration"
      mobileNavDrawerTitle="Registration Officer navigation"
      sidebarVariant="executive"
      navVariant="executive"
      showAppAside={false}
    >
      <ExecutiveThemeInitializer />
      {children}
    </OfficeShell>
  );
}
