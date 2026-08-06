'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { ShellNavLink, isShellNavLinkActive, type ShellNavVariant } from '@/layouts/ShellNavLink';
import { groupShellNavItems, type ShellNavItem } from '@/constants/navigation';
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
  /** When true (default for vertical), render category labels from nav item groups. */
  useItemGroups?: boolean;
}

type ShellNavigationLinksProps = Omit<
  ShellNavigationProps,
  'ariaLabel' | 'className' | 'groupLabel' | 'useItemGroups'
> & {
  items: ShellNavItem[];
};

const NAV_GROUP_STATE_KEY = 'wilms.shell.nav-groups';

function readCollapsedGroups(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(NAV_GROUP_STATE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCollapsedGroups(state: Record<string, boolean>): void {
  try {
    window.localStorage.setItem(NAV_GROUP_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

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

function GroupLabel({
  label,
  collapsed,
  isOpen,
  onToggle,
}: {
  label: string;
  collapsed: boolean;
  isOpen: boolean;
  onToggle?: () => void;
}) {
  if (collapsed) {
    return (
      <div
        aria-hidden="true"
        className="mx-auto my-2 h-px w-6 bg-border/50 first:mt-0"
        title={label}
      />
    );
  }

  if (!onToggle) {
    return (
      <p
        aria-hidden="true"
        className="px-3.5 pb-1 pt-3 text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-tertiary first:pt-1"
      >
        {label}
      </p>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center justify-between px-3.5 pb-1 pt-3 text-left first:pt-1"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      <span className="text-[10.5px] font-medium uppercase tracking-[0.09em] text-text-tertiary">
        {label}
      </span>
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 text-text-tertiary motion-safe:transition-transform motion-safe:duration-200',
          !isOpen && '-rotate-90',
        )}
        aria-hidden="true"
      />
    </button>
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
  useItemGroups = true,
}: ShellNavigationProps) {
  const isVertical = orientation === 'vertical';
  const groups =
    isVertical && useItemGroups
      ? groupShellNavItems(items)
      : [{ groupId: 'ungrouped' as const, label: groupLabel ?? null, items }];
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCollapsedGroups(readCollapsedGroups());
  }, []);

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
      {groupLabel && isVertical && !collapsed && !useItemGroups ? (
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
              <div key={item.href} className="h-11 rounded-lg bg-border/20 skeleton-shimmer" />
            ))}
          </div>
        }
      >
        {groups.map((group) => {
          const isGroupOpen = !collapsedGroups[group.groupId];
          return (
            <div key={group.groupId} className={isVertical ? 'w-full' : undefined}>
              {group.label && isVertical ? (
                <GroupLabel
                  label={group.label}
                  collapsed={collapsed}
                  isOpen={isGroupOpen}
                  onToggle={
                    collapsed
                      ? undefined
                      : () => {
                          setCollapsedGroups((current) => {
                            const next = {
                              ...current,
                              [group.groupId]: !current[group.groupId],
                            };
                            writeCollapsedGroups(next);
                            return next;
                          });
                        }
                  }
                />
              ) : null}
              {collapsed || isGroupOpen ? (
                <ShellNavigationLinks
                  items={group.items}
                  orientation={orientation}
                  linkClassName={linkClassName}
                  variant={variant}
                  collapsed={collapsed}
                  showSeparators={showSeparators}
                  animated={animated}
                />
              ) : null}
            </div>
          );
        })}
      </Suspense>
    </nav>
  );
}
