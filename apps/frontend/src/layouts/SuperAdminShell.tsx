'use client';

import type { ReactNode } from 'react';
import { ExecutiveThemeInitializer } from '@/components/layout/executive';
import { SUPER_ADMIN_NAV } from '@/constants/navigation';
import { OfficeShell } from '@/layouts/OfficeShell';

interface SuperAdminShellProps {
  children: ReactNode;
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  return (
    <OfficeShell
      shellId="super-admin"
      navItems={SUPER_ADMIN_NAV}
      navAriaLabel="Super Admin"
      enableMobileNavDrawer
      brandTitle="WILMS Admin"
      mobileNavDrawerTitle="Super Admin navigation"
      sidebarVariant="executive"
      navVariant="executive"
    >
      <ExecutiveThemeInitializer />
      {children}
    </OfficeShell>
  );
}
