'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ShellNavIcon } from '@/components/icons/ShellNavIcon';
import type { ShellNavIcon as ShellNavIconName } from '@/constants/navigation';
import { useUiStore } from '@/state/uiStore';
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
  const closeMobileNav = useUiStore((state) => state.closeMobileNav);
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
   * Executive active: soft emerald pill with icon tile — matches modern shell chrome.
   */
  const executiveActive = cn(
    'border-brand-primary/15 bg-brand-primary/10 text-brand-primary font-semibold',
    'shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-brand-primary)_12%,transparent)]',
    '[&_.nav-badge]:bg-brand-primary [&_.nav-badge]:text-white',
    '[&_.nav-icon-tile]:border-brand-primary/20 [&_.nav-icon-tile]:bg-brand-primary/15 [&_.nav-icon-tile]:text-brand-primary',
  );

  /**
   * Executive inactive: ghost state with subtle soft hover background.
   */
  const executiveInactive = cn(
    'border-transparent text-text-secondary font-medium',
    'hover:bg-background hover:text-text-primary',
    '[&_.nav-icon-tile]:text-text-muted group-hover:[&_.nav-icon-tile]:text-brand-primary',
  );

  /**
   * Default active: soft primary tint with bold text.
   */
  const defaultActive = cn(
    'border-brand-primary/15 bg-brand-primary/10 text-brand-primary font-semibold',
    '[&_.nav-badge]:bg-brand-primary [&_.nav-badge]:text-white',
    '[&_.nav-icon-tile]:border-brand-primary/20 [&_.nav-icon-tile]:bg-brand-primary/15 [&_.nav-icon-tile]:text-brand-primary',
  );

  /**
   * Default inactive: ghost with soft hover state.
   */
  const defaultInactive = cn(
    'border-transparent text-text-secondary font-medium',
    'hover:bg-background hover:text-text-primary',
    '[&_.nav-icon-tile]:text-text-muted group-hover:[&_.nav-icon-tile]:text-brand-primary',
  );

  // Prefer full href (incl. query) so tour selectors can target Applications vs Borrowers.
  const tourNavPath = href;

  // ─── PILL MODE (Instagram-style floating nav) ────────────────────────────
  if (pillMode) {
    return (
      <Link
        prefetch
        href={href}
        onClick={closeMobileNav}
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
        onClick={closeMobileNav}
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
      onClick={closeMobileNav}
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
        'group relative flex items-center gap-2.5',
        'min-h-[44px]',
        collapsed ? 'justify-center px-2.5 py-2' : 'px-2.5 py-2',
        'rounded-xl border',
        'text-[13px] font-medium tracking-[0.01em]',
        baseInteraction,
        'active:scale-[0.985]',
        isActive
          ? cn(variant === 'executive' ? executiveActive : defaultActive, activeClassName)
          : cn(variant === 'executive' ? executiveInactive : defaultInactive, inactiveClassName),
        className,
      )}
    >
      {showIndicator && isActive && !collapsed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-primary opacity-90"
        />
      )}

      {icon && (
        <span
          className={cn(
            'nav-icon-tile inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent bg-background/70',
            'transition-colors duration-[130ms]',
          )}
          aria-hidden="true"
        >
          <ShellNavIcon
            name={icon}
            className={cn(
              'h-[17px] w-[17px] transition-transform duration-[130ms]',
              animated && !collapsed && 'group-hover:translate-x-px',
            )}
          />
        </span>
      )}

      <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>{label}</span>

      {badge !== undefined && !collapsed && (
        <span
          aria-label={`${badge} notifications`}
          className={cn(
            'nav-badge ml-auto min-w-[20px] rounded-full px-2 py-px',
            'text-center text-[11px] font-semibold leading-[16px]',
            isActive ? 'bg-brand-primary text-card' : 'bg-text-primary text-background',
          )}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
