'use client';

import type { ReactNode } from 'react';
import { BackgroundUploadProcessor } from '@/components/offline/BackgroundUploadProcessor';
import { COLLECTOR_NAV } from '@/constants/navigation';
import { OfficeShell } from '@/layouts/OfficeShell';

interface CollectorShellProps {
  children: ReactNode;
}

export function CollectorShell({ children }: CollectorShellProps) {
  return (
    <>
      <BackgroundUploadProcessor />
      <OfficeShell
        shellId="collector"
        navItems={COLLECTOR_NAV}
        navAriaLabel="Collector Navigation"
        mobileNavDrawerTitle="Collector navigation"
        operationalMobileNav
        enableMobileNavDrawer
        brandTitle="WILMS Field"
        sidebarVariant="executive"
        navVariant="executive"
        showAppAside={false}
      >
        {children}
      </OfficeShell>
    </>
  );
}
