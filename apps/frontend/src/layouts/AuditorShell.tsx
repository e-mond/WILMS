'use client';

import type { ReactNode } from 'react';
import { AUDITOR_NAV } from '@/constants/navigation';
import { OfficeShell } from '@/layouts/OfficeShell';

interface AuditorShellProps {
  children: ReactNode;
}

export function AuditorShell({ children }: AuditorShellProps) {
  return (
    <OfficeShell
      shellId="auditor"
      navItems={AUDITOR_NAV}
      navAriaLabel="Auditor"
      operationalMobileNav
      brandTitle="WILMS Auditor"
      mobileNavDrawerTitle="Auditor navigation"
      sidebarVariant="executive"
      navVariant="executive"
      showAppAside={false}
    >
      {children}
    </OfficeShell>
  );
}
