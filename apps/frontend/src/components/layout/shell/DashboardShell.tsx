'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppAside, AppAsidePlaceholder } from '@/components/layout/shell/AppAside';
import { AsideSlotProvider } from '@/components/layout/shell/AsideSlotContext';
import { ShellAsideDrawer } from '@/components/layout/shell/ShellAsideDrawer';
import { AppNavbar } from '@/components/layout/shell/AppNavbar';
import { AppSidebar } from '@/components/layout/shell/AppSidebar';
import { OfficeShellFooter } from '@/components/layout/OfficeShellFooter';
import { Drawer } from '@/components/ui/Drawer';
import type { ShellProfile } from '@/constants/shell-profiles';
import { SHELL_PROFILE } from '@/constants/shell-profiles';
import type { ShellNavItem } from '@/constants/navigation';
import { MobileSidebarTrigger } from '@/components/layout/shell/MobileSidebarTrigger';
import { ShellOverlayPanels } from '@/components/layout/shell/navbar/ShellOverlayPanels';
import { OfficeShellMobileBar } from '@/layouts/OfficeShellMobileBar';
import { ShellMainLandmark } from '@/layouts/ShellMainLandmark';
import type { ShellNavVariant } from '@/layouts/ShellNavLink';
import { useShellLayoutStore } from '@/state/shellLayoutStore';
import { useUiStore } from '@/state/uiStore';
import { cn } from '@/utils/cn';

function resolveMobileNavDrawerTitle(navAriaLabel: string): string {
  if (/navigation$/i.test(navAriaLabel.trim())) {
    return navAriaLabel;
  }

  return `${navAriaLabel} navigation`;
}

export interface DashboardShellProps {
  shellId: string;
  profile: ShellProfile;
  navItems: ShellNavItem[];
  navAriaLabel: string;
  mobileNavDrawerTitle?: string;
  children: ReactNode;
  sidebarVariant?: 'executive' | 'standard';
  navVariant?: ShellNavVariant;
  showLiveBadge?: boolean;
  versionLabel?: string;
  brandTitle?: string;
  showAppAside?: boolean;
  /** When false, mobile sidebar drawer and FAB are hidden (operational bottom-nav roles). */
  enableMobileNavDrawer?: boolean;
  mobileHeader?: ReactNode;
  bottomNavigation?: ReactNode;
  sidebarFooter?: ReactNode;
  mainClassName?: string;
  className?: string;
}

export function DashboardShell({
  shellId,
  profile,
  navItems,
  navAriaLabel,
  mobileNavDrawerTitle,
  children,
  sidebarVariant = 'executive',
  navVariant = 'executive',
  showLiveBadge = false,
  versionLabel,
  brandTitle,
  showAppAside = true,
  enableMobileNavDrawer = true,
  mobileHeader,
  bottomNavigation,
  sidebarFooter,
  mainClassName,
  className,
}: DashboardShellProps) {
  const isExecutive = sidebarVariant === 'executive';
  const pathname = usePathname();
  const isOffice = profile === SHELL_PROFILE.OFFICE;

  const isMobileNavOpen = useUiStore((state) => state.isMobileNavOpen);
  const closeMobileNav = useUiStore((state) => state.closeMobileNav);
  const closeAsideDrawer = useUiStore((state) => state.closeAsideDrawer);
  const isSidebarCollapsed = useShellLayoutStore((state) => state.isSidebarCollapsed);

  const showMobileDrawer = enableMobileNavDrawer && (isOffice || Boolean(mobileHeader));

  useEffect(() => {
    closeMobileNav();

    if (useUiStore.getState().isAsideDrawerOpen) {
      closeAsideDrawer();
    }
  }, [pathname, closeMobileNav, closeAsideDrawer]);

  const sidebarContent = (
    <AppSidebar
      navItems={navItems}
      navAriaLabel={navAriaLabel}
      navVariant={navVariant}
      isExecutive={isExecutive}
      brandTitle={brandTitle}
      versionLabel={versionLabel}
      footer={sidebarFooter}
    />
  );

  return (
    <AsideSlotProvider>
      <div
        data-shell={shellId}
        data-shell-profile={profile}
        className={cn(
          'flex min-h-screen flex-col bg-background text-text-primary',
          className,
        )}
      >
        {/* Office Top Navbar */}
        {isOffice && (
          <AppNavbar
            profile={profile}
            showLiveBadge={showLiveBadge}
            variant={isExecutive ? 'executive' : 'standard'}
            className="h-14"
            showMobileNavTrigger={showMobileDrawer}
          />
        )}

        <div className="flex min-h-0 flex-1">
          {/* Desktop Sidebar */}
          <aside
            data-sidebar={isExecutive ? 'executive' : 'standard'}
            data-sidebar-collapsed={isSidebarCollapsed ? 'true' : undefined}
            aria-hidden={isMobileNavOpen}
            className={cn(
              'hidden shrink-0 flex-col border-r border-border transition-[width] duration-200 md:flex',
              isExecutive ? 'bg-executive-sidebar' : 'bg-card',
              isSidebarCollapsed ? 'w-16' : 'w-60',
            )}
          >
            {sidebarContent}
          </aside>

          {/* Mobile Navigation Drawer */}
          {showMobileDrawer ? (
            <Drawer
              isOpen={isMobileNavOpen}
              onClose={closeMobileNav}
              title={mobileNavDrawerTitle ?? resolveMobileNavDrawerTitle(navAriaLabel)}
              sidebarVariant={isExecutive ? 'executive' : 'standard'}
              hideHeader={isExecutive}
            >
              <div className="flex h-full flex-col">
                {sidebarContent}
              </div>
            </Drawer>
          ) : null}

          {/* Main Content Area */}
          <div className="flex min-w-0 flex-1 flex-col">
            {showMobileDrawer ? <MobileSidebarTrigger /> : null}
            {mobileHeader}

            {/* Mobile bar — skip when a custom mobileHeader is supplied */}
            {isOffice && !mobileHeader ? (
              <OfficeShellMobileBar
                brandTitle={brandTitle}
                isExecutive={isExecutive}
              />
            ) : !isOffice ? (
              <div className="hidden md:block">
                <AppNavbar
                  profile={profile}
                  showLiveBadge={showLiveBadge}
                  variant="executive"
                  className="h-14"
                  showMobileNavTrigger={showMobileDrawer}
                />
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1">
              <ShellMainLandmark
                className={cn(
                  'min-w-0 flex-1 bg-background',
                  Boolean(bottomNavigation) && 'pb-24 md:pb-0',
                  mainClassName,
                )}
                data-executive-content={isExecutive ? 'true' : undefined}
              >
                {children}
              </ShellMainLandmark>

              {showAppAside && (
                <AppAside
                  profile={profile}
                  fallback={<AppAsidePlaceholder />}
                />
              )}
            </div>

            <div className={cn(Boolean(bottomNavigation) && 'hidden md:block')}>
              <OfficeShellFooter />
            </div>

            {bottomNavigation}
          </div>
        </div>

        {showAppAside && isOffice && <ShellAsideDrawer />}
        <ShellOverlayPanels />
      </div>
    </AsideSlotProvider>
  );
}