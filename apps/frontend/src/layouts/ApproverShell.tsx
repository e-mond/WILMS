'use client';

import type { ReactNode } from 'react';
import { ExecutiveThemeInitializer } from '@/components/layout/executive';
import { APPROVER_NAV } from '@/constants/navigation';
import { OfficeShell } from '@/layouts/OfficeShell';

interface ApproverShellProps {
  children: ReactNode;
}

export function ApproverShell({ children }: ApproverShellProps) {
  return (
    <OfficeShell
      shellId="approver"
      navItems={APPROVER_NAV}
      navAriaLabel="Approver Navigation"
      mobileNavDrawerTitle="Approver navigation"
      operationalMobileNav
      brandTitle="WILMS Approver"
      sidebarVariant="executive"
      navVariant="executive"
      showLiveBadge
    >
      <ExecutiveThemeInitializer />
      {children}
    </OfficeShell>
  );
}