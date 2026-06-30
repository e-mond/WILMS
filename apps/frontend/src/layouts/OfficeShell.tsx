'use client';

import type { ReactNode } from 'react';
import { DashboardShell } from '@/components/layout/shell/DashboardShell';
import { SHELL_PROFILE } from '@/constants/shell-profiles';
import type { ShellNavItem } from '@/constants/navigation';
import type { ShellNavVariant } from '@/layouts/ShellNavLink';
import {
  OperationalBottomNavigation,
  OperationalMobileHeader,
} from '@/layouts/OperationalMobileNavigation';
import { useFilteredNavItems } from '@/hooks/useFilteredNavItems';
import { getAppVersionLabel } from '@/lib/app-version';

export interface OfficeShellProps {
  shellId: string;
  navItems: ShellNavItem[];
  navAriaLabel: string;
  children: ReactNode;
  sidebarVariant?: 'executive' | 'standard';
  navVariant?: ShellNavVariant;
  versionLabel?: string;
  brandTitle?: string;
  mobileNavDrawerTitle?: string;
  showAppAside?: boolean;
  operationalMobileNav?: boolean;
  enableMobileNavDrawer?: boolean;
}

export function OfficeShell({
  shellId,
  navItems,
  navAriaLabel,
  children,
  sidebarVariant = 'standard',
  navVariant = 'executive',
  versionLabel = getAppVersionLabel(),
  brandTitle,
  mobileNavDrawerTitle,
  showAppAside = true,
  operationalMobileNav = false,
  enableMobileNavDrawer,
}: OfficeShellProps) {
  const filteredNavItems = useFilteredNavItems(navItems);
  const isExecutive = sidebarVariant === 'executive';
  const resolvedBrandTitle = brandTitle ?? 'WILMS';

  return (
    <DashboardShell
      shellId={shellId}
      profile={SHELL_PROFILE.OFFICE}
      navItems={filteredNavItems}
      navAriaLabel={navAriaLabel}
      mobileNavDrawerTitle={mobileNavDrawerTitle}
      sidebarVariant={sidebarVariant}
      navVariant={navVariant}
      versionLabel={versionLabel}
      brandTitle={brandTitle}
      showAppAside={showAppAside}
      enableMobileNavDrawer={enableMobileNavDrawer ?? !operationalMobileNav}
      mobileHeader={
        operationalMobileNav ? (
          <OperationalMobileHeader brandTitle={resolvedBrandTitle} isExecutive={isExecutive} />
        ) : undefined
      }
      bottomNavigation={
        operationalMobileNav ? (
          <OperationalBottomNavigation
            navItems={filteredNavItems}
            ariaLabel={`${navAriaLabel} bottom navigation`}
          />
        ) : undefined
      }
    >
      {children}
    </DashboardShell>
  );
}
