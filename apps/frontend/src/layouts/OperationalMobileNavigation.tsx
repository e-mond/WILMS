'use client';

import type { ShellNavItem } from '@/constants/navigation';
import { OfficeShellMobileBar } from '@/layouts/OfficeShellMobileBar';
import { ShellNavLink } from '@/layouts/ShellNavLink';
import { cn } from '@/utils/cn';

export function filterOperationalBottomNavItems(navItems: ShellNavItem[]): ShellNavItem[] {
  return navItems.filter((item) => !item.href.endsWith('/settings'));
}

function resolveBottomNavGridClass(count: number): string {
  if (count <= 3) {
    return 'grid-cols-3';
  }

  if (count === 4) {
    return 'grid-cols-4';
  }

  return 'grid-cols-5';
}

export interface OperationalMobileHeaderProps {
  brandTitle: string;
  isExecutive?: boolean;
}

export function OperationalMobileHeader({ brandTitle, isExecutive = true }: OperationalMobileHeaderProps) {
  return <OfficeShellMobileBar brandTitle={brandTitle} isExecutive={isExecutive} />;
}

export interface OperationalBottomNavigationProps {
  navItems: ShellNavItem[];
  ariaLabel: string;
}

export function OperationalBottomNavigation({ navItems, ariaLabel }: OperationalBottomNavigationProps) {
  const bottomItems = filterOperationalBottomNavItems(navItems);

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 md:hidden',
        'border-t border-border/40',
        'bg-card/95 backdrop-blur-lg',
        'px-2 pt-1.5',
        'pb-[max(8px,env(safe-area-inset-bottom))]',
      )}
    >
      <ul role="tablist" className={cn('grid gap-0.5', resolveBottomNavGridClass(bottomItems.length))}>
        {bottomItems.map((item) => (
          <li key={item.href} role="presentation">
            <ShellNavLink
              {...item}
              tabMode
              variant="executive"
              inactiveClassName="text-text-muted hover:bg-muted/80"
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}
