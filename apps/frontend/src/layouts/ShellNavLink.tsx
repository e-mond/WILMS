'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShellNavIcon } from '@/components/icons/ShellNavIcon';
import type { ShellNavIcon as ShellNavIconName } from '@/constants/navigation';
import { cn } from '@/utils/cn';

export type ShellNavVariant = 'default' | 'executive';

function splitNavHref(href: string | undefined): { pathname: string; search: string } {
  const normalizedHref = href ?? '/';
  const [pathname, search = ''] = normalizedHref.split('?');

  return { pathname, search };
}

function matchesNavSearch(currentSearch: string, expectedSearch: string): boolean {
  if (!expectedSearch) {
    return !currentSearch || currentSearch === '?';
  }

  const expectedParams = new URLSearchParams(expectedSearch);
  const currentParams = new URLSearchParams(currentSearch.replace(/^\?/, ''));

  return Array.from(expectedParams.entries()).every(
    ([key, value]) => currentParams.get(key) === value,
  );
}

export function isShellNavLinkActive(
  pathname: string,
  currentSearch: string,
  href: string,
  exact = false,
): boolean {
  const { pathname: hrefPath, search: hrefSearch } = splitNavHref(href);
  const normalizedSearch = currentSearch.startsWith('?') ? currentSearch.slice(1) : currentSearch;

  if (hrefSearch) {
    return pathname === hrefPath && matchesNavSearch(normalizedSearch, hrefSearch);
  }

  if (exact) {
    return pathname === hrefPath && !normalizedSearch;
  }

  const pathMatches = pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

  if (!pathMatches) {
    return false;
  }

  if (hrefPath === '/borrowers') {
    const pendingStatus = new URLSearchParams(normalizedSearch).get('status');

    if (pendingStatus === 'PENDING') {
      return false;
    }
  }

  if (hrefPath === '/reports' && pathname.startsWith('/reports/')) {
    return false;
  }

  if (hrefPath === '/auditor/reports' && pathname.startsWith('/auditor/') && pathname !== '/auditor/reports') {
    return false;
  }

  return true;
}

export interface ShellNavLinkProps {
  /** When provided, skips internal pathname subscription (used by ShellNavigation). */
  isActive?: boolean;
  href: string;
  label: string;
  exact?: boolean;
  icon?: ShellNavIconName;
  variant?: ShellNavVariant;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
  collapsed?: boolean;
  /**
   * Show a slim 3 px left-edge indicator on active items.
   * Only applies to the `default` variant in sidebar mode.
   */
  showIndicator?: boolean;
  /** Directional icon nudge (translateX) on hover — disable for dense lists */
  animated?: boolean;
  /** Optional badge count (e.g. notification count). Hidden when collapsed. */
  badge?: string | number;
  /**
   * Mobile bottom-tab mode.
   * Renders icon stacked above label; uses `role="tab"` / `aria-selected`
   * semantics instead of `aria-current="page"`.
   */
  tabMode?: boolean;
  /**
   * Instagram-style floating pill tab (mobile operational shells).
   */
  pillMode?: boolean;
}

export function ShellNavLink({
  href,
  label,
  exact = false,
  icon,
  variant = 'default',
  className,
  activeClassName,
  inactiveClassName,
  collapsed = false,
  showIndicator = true,
  animated = true,
  badge,
  tabMode = false,
  pillMode = false,
  isActive: isActiveOverride,
}: ShellNavLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const isActive =
    isActiveOverride ??
    isShellNavLinkActive(pathname, currentSearch, href, exact);

  // ─── Shared base classes ──────────────────────────────────────────────────

  const baseInteraction = cn(
    'transition-all duration-[130ms] select-none',
    '[WebkitTapHighlightColor:transparent]',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-primary',
  );

  // ─── Variant colour maps ──────────────────────────────────────────────────

  /**
   * Executive active: gold accent surface — matches Settings category nav.
   */
  const executiveActive = cn(
    'border-executive-gold bg-brand-primary-light text-executive-gold',
    '[&_.nav-badge]:bg-executive-gold [&_.nav-badge]:text-background',
  );

  /**
   * Executive inactive: no background; lifted card + border on hover.
   */
  const executiveInactive = cn(
    'border-transparent text-text-secondary',
    'hover:border-border/40 hover:bg-background hover:text-text-primary',
  );

  /**
   * Default active: white card surface with slim left indicator bar.
   */
  const defaultActive = cn(
    'bg-background text-text-primary border-border/50',
  );

  /**
   * Default inactive: ghost — only shows card on hover.
   */
  const defaultInactive = cn(
    'text-text-secondary border-transparent',
    'hover:bg-background hover:border-border/30 hover:text-text-primary',
  );

  const tourNavPath = splitNavHref(href).pathname;

  // ─── PILL MODE (Instagram-style floating nav) ────────────────────────────
  if (pillMode) {
    return (
      <Link
        prefetch
        href={href}
        data-tour-nav={tourNavPath}
        aria-current={isActive ? 'page' : undefined}
        title={label}
        className={cn(
          'relative flex flex-1 items-center justify-center',
          'min-h-[44px] min-w-[44px] rounded-full px-4 py-2.5',
          baseInteraction,
          'active:scale-[0.92]',
          isActive
            ? cn('bg-white/20 text-white', activeClassName)
            : cn('text-white/70 hover:bg-white/10 hover:text-white', inactiveClassName),
          className,
        )}
      >
        {icon && (
          <ShellNavIcon
            name={icon}
            className="h-6 w-6 flex-shrink-0"
            aria-hidden="true"
          />
        )}

        <span className="sr-only">{label}</span>

        {badge !== undefined && (
          <span
            aria-label={`${badge} notifications`}
            className="nav-badge absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#262626]"
          />
        )}
      </Link>
    );
  }

  // ─── TAB MODE (mobile bottom bar) ────────────────────────────────────────
  if (tabMode) {
    return (
      <Link
        prefetch
        href={href}
        data-tour-nav={tourNavPath}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          // Layout — icon above label
          'relative flex flex-1 flex-col items-center justify-center gap-1',
          // Touch target: 56 px meets WCAG 2.5.5 on mobile
          'min-h-[56px] px-2 py-2',
          // Shape & border
          'rounded-lg border',
          // Typography — compact tab labels
          'text-[10.5px] font-medium tracking-wide',
          baseInteraction,
          // Press feedback
          'active:scale-[0.96]',
          isActive
            ? cn('bg-background border-border/50 text-text-primary', activeClassName)
            : cn(
                'border-transparent text-text-muted',
                'hover:bg-background hover:border-border/30 hover:text-text-secondary',
                inactiveClassName,
              ),
          className,
        )}
      >
        {icon && (
          <ShellNavIcon
            name={icon}
            className="h-5 w-5 flex-shrink-0"
            aria-hidden="true"
          />
        )}

        <span className="whitespace-nowrap">{label}</span>

        {badge !== undefined && (
          <span
            aria-label={`${badge} notifications`}
            className="nav-badge absolute right-[calc(50%-18px)] top-1.5 min-w-[16px] rounded-full bg-text-primary px-1 py-px text-center text-[10px] font-semibold leading-[14px] text-background"
          >
            {badge}
          </span>
        )}
      </Link>
    );
  }

  // ─── SIDEBAR LINK (default) ───────────────────────────────────────────────
  return (
    <Link
      prefetch
      href={href}
      data-tour-nav={tourNavPath}
      aria-current={isActive ? 'page' : undefined}
      // In collapsed state the label is visually hidden; put it in aria-label
      // and include the badge count so screen readers get the full picture.
      aria-label={
        collapsed
          ? badge !== undefined
            ? `${label}, ${badge} unread`
            : label
          : undefined
      }
      title={collapsed ? label : undefined}
      className={cn(
        'group relative flex items-center gap-[11px]',
        // WCAG 2.5.5: minimum 44 px touch target on all interactive elements
        'min-h-[44px]',
        collapsed
          ? 'justify-center px-3 py-[9px]'
          : 'px-3 py-[9px] pl-3.5',
        'rounded-lg border',
        'text-[13.5px] font-medium tracking-[0.01em]',
        baseInteraction,
        'active:scale-[0.985]',
        isActive
          ? cn(
              variant === 'executive' ? executiveActive : defaultActive,
              activeClassName,
            )
          : cn(
              variant === 'executive' ? executiveInactive : defaultInactive,
              inactiveClassName,
            ),
        className,
      )}
    >
      {/* Slim left indicator — active, expanded only */}
      {showIndicator && isActive && !collapsed && (
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-0 top-1/2 h-[18px] w-[3px] -translate-y-1/2 rounded-r-[2px] opacity-85',
            variant === 'executive' ? 'bg-executive-gold' : 'bg-text-primary',
          )}
        />
      )}

      {icon && (
        <ShellNavIcon
          name={icon}
          aria-hidden="true"
          className={cn(
            'h-[18px] w-[18px] flex-shrink-0 transition-transform duration-[130ms]',
            // Directional nudge — more intentional than scale
            animated && !collapsed && 'group-hover:translate-x-px',
          )}
        />
      )}

      {/* Label: visually hidden when collapsed; still in DOM for a11y via aria-label */}
      <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>
        {label}
      </span>

      {badge !== undefined && !collapsed && (
        <span
          aria-label={`${badge} notifications`}
          className={cn(
            'nav-badge ml-auto min-w-[20px] rounded-full px-2 py-px',
            'text-center text-[11px] font-semibold leading-[16px]',
            // Invert badge on executive active so it stays readable
            isActive && variant === 'executive'
              ? 'bg-executive-gold text-background'
              : 'bg-text-primary text-background',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}