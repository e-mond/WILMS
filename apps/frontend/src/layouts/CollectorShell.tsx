'use client';



import type { ReactNode } from 'react';

import { DashboardShell } from '@/components/layout/shell/DashboardShell';

import { CollectorOfflineShell } from '@/components/offline/CollectorOfflineShell';

import { COLLECTOR_NAV } from '@/constants/navigation';

import { SHELL_PROFILE } from '@/constants/shell-profiles';

import {

  OperationalBottomNavigation,

  OperationalMobileHeader,

} from '@/layouts/OperationalMobileNavigation';



interface CollectorShellProps {

  children: ReactNode;

}



export function CollectorShell({ children }: CollectorShellProps) {

  return (

    <CollectorOfflineShell>

      <DashboardShell

        shellId="collector"

        profile={SHELL_PROFILE.FIELD}

        navItems={COLLECTOR_NAV}

        navAriaLabel="Collector Navigation"

        sidebarVariant="executive"

        navVariant="executive"

        showAppAside={false}

        enableMobileNavDrawer={false}
        mobileNavDrawerTitle="Collector navigation"

        mobileHeader={<OperationalMobileHeader brandTitle="WILMS Field" isExecutive />}

        bottomNavigation={

          <OperationalBottomNavigation

            navItems={COLLECTOR_NAV}

            ariaLabel="Collector bottom navigation"

          />

        }

      >

        {children}

      </DashboardShell>

    </CollectorOfflineShell>

  );

}

