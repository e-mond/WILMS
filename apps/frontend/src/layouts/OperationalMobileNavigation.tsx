'use client';

import type { ShellNavItem } from '@/constants/navigation';
import { OfficeShellMobileBar } from '@/layouts/OfficeShellMobileBar';
import { ShellNavLink } from '@/layouts/ShellNavLink';
import { cn } from '@/utils/cn';

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
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'fixed inset-x-0 bottom-0 z-[60] md:hidden',
        'pointer-events-none',
        'px-4 pb-[max(12px,env(safe-area-inset-bottom))]',
      )}
    >
      <ul
        className={cn(
          'pointer-events-auto mx-auto flex max-w-lg items-center justify-between',
          'rounded-full border border-white/10',
          'bg-[#262626]/95 backdrop-blur-xl',
          'px-1.5 py-1.5 shadow-2xl shadow-black/35',
        )}
      >
        {navItems.map((item) => (
          <li key={item.href} role="presentation" className="flex flex-1 justify-center">
            <ShellNavLink {...item} pillMode variant="executive" />
          </li>
        ))}
      </ul>
    </nav>
  );
}
