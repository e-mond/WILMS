'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShellNavLink, isShellNavLinkActive, type ShellNavVariant } from '@/layouts/ShellNavLink';
import type { ShellNavItem } from '@/constants/navigation';
import { cn } from '@/utils/cn';

export interface ShellNavigationProps {
  items: ShellNavItem[];
  ariaLabel: string;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
  linkClassName?: string;
  variant?: ShellNavVariant;
  collapsed?: boolean;
  showSeparators?: boolean;
  animated?: boolean;
  groupLabel?: string;
}

type ShellNavigationLinksProps = Omit<ShellNavigationProps, 'ariaLabel' | 'className' | 'groupLabel'>;

function ShellNavigationLinks({
  items,
  orientation = 'vertical',
  linkClassName,
  variant = 'default',
  collapsed = false,
  showSeparators = false,
  animated = true,
}: ShellNavigationLinksProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const isVertical = orientation === 'vertical';

  return (
    <>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isActive = isShellNavLinkActive(pathname, currentSearch, item.href, item.exact);

        return (
          <div key={item.href} className={isVertical ? 'w-full' : undefined}>
            <ShellNavLink
              {...item}
              isActive={isActive}
              variant={variant}
              collapsed={collapsed}
              animated={animated}
              className={linkClassName}
            />

            {showSeparators && isVertical && !isLast ? (
              <hr
                role="separator"
                aria-hidden="true"
                className="mx-3 my-1.5 border-t border-border/30"
              />
            ) : null}
          </div>
        );
      })}
    </>
  );
}

export function ShellNavigation({
  items,
  ariaLabel,
  className,
  orientation = 'vertical',
  linkClassName,
  variant = 'default',
  collapsed = false,
  showSeparators = false,
  animated = true,
  groupLabel,
}: ShellNavigationProps) {
  const isVertical = orientation === 'vertical';

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        isVertical
          ? 'flex flex-col gap-0.5'
          : 'flex flex-wrap items-center gap-x-1 gap-y-2',
        className,
      )}
    >
      {groupLabel && isVertical && !collapsed ? (
        <p
          aria-hidden="true"
          className="px-3.5 pb-1.5 pt-1 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-tertiary"
        >
          {groupLabel}
        </p>
      ) : null}

      <Suspense
        fallback={
          <div className="space-y-1 px-3" aria-hidden="true">
            {items.map((item) => (
              <div key={item.href} className="h-11 rounded-lg bg-border/20" />
            ))}
          </div>
        }
      >
        <ShellNavigationLinks
          items={items}
          orientation={orientation}
          linkClassName={linkClassName}
          variant={variant}
          collapsed={collapsed}
          showSeparators={showSeparators}
          animated={animated}
        />
      </Suspense>
    </nav>
  );
}
