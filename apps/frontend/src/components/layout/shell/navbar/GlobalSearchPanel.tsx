'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/data-display/Avatar';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/feedback/Skeleton';
import { useGlobalSearch } from '@/features/global-search/hooks/useGlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
import type { GlobalSearchEntityType, GlobalSearchResult } from '@/types/search';
import { GLOBAL_SEARCH_ENTITY } from '@/types/search';
import { getGlobalSearchPlaceholder } from '@/utils/global-search-scope';
import { SEARCH_NAVIGATION_DESTINATIONS } from '@/constants/search-navigation';
import {
  BookOpen,
  Briefcase,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { HighlightedText } from '@/components/feedback/HighlightedText';
import { cn } from '@/utils/cn';
import { USER_ROLE } from '@/constants/roles';

const ENTITY_LABELS: Record<GlobalSearchEntityType, string> = {
  [GLOBAL_SEARCH_ENTITY.BORROWER]: 'Borrowers',
  [GLOBAL_SEARCH_ENTITY.GROUP]: 'Groups',
  [GLOBAL_SEARCH_ENTITY.COLLECTOR]: 'Collectors',
  [GLOBAL_SEARCH_ENTITY.LOAN_POOL]: 'Loan Pools',
  [GLOBAL_SEARCH_ENTITY.LOAN]: 'Loans',
  [GLOBAL_SEARCH_ENTITY.REPORT]: 'Reports',
  [GLOBAL_SEARCH_ENTITY.USER]: 'Users',
  [GLOBAL_SEARCH_ENTITY.REGISTRATION]: 'Registrations',
  [GLOBAL_SEARCH_ENTITY.PAYMENT]: 'Payments',
  [GLOBAL_SEARCH_ENTITY.APPLICATION]: 'Applications',
  [GLOBAL_SEARCH_ENTITY.AUDIT_LOG]: 'Audit Log',
  [GLOBAL_SEARCH_ENTITY.RISK_FLAG]: 'Risk Flags',
};

const NAV_ICONS: Record<string, LucideIcon> = {
  '/dashboard': LayoutDashboard,
  '/executive': Briefcase,
  '/ops': ClipboardList,
  '/borrowers': Users,
  '/loan-pools': Wallet,
  '/reports': FileText,
  '/documentation': BookOpen,
  '/settings': Settings,
  '/collector/dashboard': LayoutDashboard,
  '/officer/register': Users,
  '/approver/pending': ClipboardList,
};

const NAV_TONE: Record<string, string> = {
  '/dashboard':
    'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
  '/executive':
    'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400',
  '/ops':
    'border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-400',
  '/borrowers':
    'border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-400',
  '/loan-pools':
    'border-emerald-100 bg-emerald-50 text-brand-primary dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
  '/reports':
    'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
  '/documentation':
    'border-indigo-100 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-950/40 dark:text-indigo-400',
  '/settings':
    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

const RECENT_SEARCH_KEY = 'wilms.global-search.recent';
const RECENT_SEARCH_LIMIT = 6;

type RecentSearch = { query: string; at: number };

function readRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentSearch[];
    return Array.isArray(parsed) ? parsed.slice(0, RECENT_SEARCH_LIMIT) : [];
  } catch {
    return [];
  }
}

function pushRecentSearch(query: string): void {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  const next = [
    { query: trimmed, at: Date.now() },
    ...readRecentSearches().filter((entry) => entry.query.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, RECENT_SEARCH_LIMIT);
  try {
    window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

type CommandItem = {
  id: string;
  label: string;
  subtitle?: string;
  href: string;
  group: string;
};

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function humanReadableSubtitle(result: GlobalSearchResult): string | undefined {
  if (!result.subtitle) {
    return undefined;
  }
  if (looksLikeUuid(result.subtitle)) {
    return result.status ?? 'Record';
  }
  return result.subtitle;
}

function NavigationGlyph({ href }: { href: string }) {
  const Icon = NAV_ICONS[href] ?? LayoutDashboard;
  const tone =
    NAV_TONE[href] ??
    'border-border bg-background text-brand-primary';

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
        tone,
      )}
      aria-hidden="true"
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function GlobalSearchPanel() {
  const titleId = useId();
  const router = useRouter();
  const { user } = useAuth();
  const isOpen = useUiStore((state) => state.isGlobalSearchOpen);
  const closeGlobalSearch = useUiStore((state) => state.closeGlobalSearch);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const activeIndexRef = useRef(0);
  const commandItemsRef = useRef<CommandItem[]>([]);

  const { data: results = [], isFetching, isError } = useGlobalSearch(
    {
      query,
      role: user!.role,
      limit: 12,
    },
    Boolean(user) && isOpen && query.trim().length >= 1,
  );

  const navigationItems = useMemo(() => {
    if (!user) {
      return [] as CommandItem[];
    }
    const destinations = SEARCH_NAVIGATION_DESTINATIONS.filter((item) =>
      item.roles.includes(user.role),
    );
    const normalized = query.trim().toLowerCase();
    return destinations
      .filter((item) => {
        if (!normalized) {
          return true;
        }
        return (
          item.label.toLowerCase().includes(normalized) ||
          item.keywords.some((keyword) => keyword.includes(normalized))
        );
      })
      .slice(0, 8)
      .map((item) => ({
        id: `nav:${item.href}`,
        label: item.label,
        subtitle: item.description,
        href: item.href,
        group: 'Navigation',
      }));
  }, [query, user]);

  const commandItems = useMemo(() => {
    const items: CommandItem[] = [...navigationItems];
    for (const result of results) {
      items.push({
        id: `${result.entityType}:${result.id}`,
        label: result.label,
        subtitle: humanReadableSubtitle(result),
        href: result.href,
        group: ENTITY_LABELS[result.entityType] ?? 'Results',
      });
    }
    return items;
  }, [navigationItems, results]);

  commandItemsRef.current = commandItems;
  activeIndexRef.current = activeIndex;

  const groupedCommands = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of commandItems) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [commandItems]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const selectActive = useCallback(() => {
    const items = commandItemsRef.current;
    const target = items[activeIndexRef.current];
    if (!target) {
      return;
    }
    pushRecentSearch(query);
    setRecentSearches(readRecentSearches());
    closeGlobalSearch();
    router.push(target.href);
  }, [closeGlobalSearch, query, router]);

  useEffect(() => {
    if (isOpen) {
      setRecentSearches(readRecentSearches());
    }
  }, [isOpen]);

  const moveActive = useCallback((direction: 1 | -1) => {
    setActiveIndex((index) => {
      const last = Math.max(commandItemsRef.current.length - 1, 0);
      if (direction > 0) {
        return Math.min(index + 1, last);
      }
      return Math.max(index - 1, 0);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      if (event.key === 'ArrowDown') {
        moveActive(1);
        return;
      }
      if (event.key === 'ArrowUp') {
        moveActive(-1);
        return;
      }
      selectActive();
    };

    document.addEventListener('keydown', handleDocumentKeyDown, true);
    return () => document.removeEventListener('keydown', handleDocumentKeyDown, true);
  }, [isOpen, moveActive, selectActive]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const active = commandItems[activeIndex];
    if (!active) {
      return;
    }
    const option = document.getElementById(`search-option-${active.id}`);
    option?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, commandItems, isOpen]);

  if (!user) {
    return null;
  }

  let flatIndex = -1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeGlobalSearch}
      title="Search WILMS"
      className="max-w-2xl"
    >
      <div data-global-search-panel="true" className="space-y-wilms-4 motion-enter-fade">
        <label className="block" htmlFor={`${titleId}-search`}>
          <span className="sr-only">Search WILMS records and navigation</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary"
              aria-hidden="true"
            />
            <Input
              id={`${titleId}-search`}
              type="text"
              value={query}
              placeholder={getGlobalSearchPlaceholder(user.role)}
              autoComplete="off"
              autoFocus
              role="combobox"
              aria-autocomplete="list"
              aria-controls={`${titleId}-results`}
              aria-expanded={commandItems.length > 0}
              aria-activedescendant={
                commandItems[activeIndex]
                  ? `search-option-${commandItems[activeIndex]!.id}`
                  : undefined
              }
              onChange={(event) => setQuery(event.target.value)}
              className="h-12 rounded-xl border-border bg-background pl-11 pr-16 text-body shadow-xs"
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
              ESC
            </kbd>
          </div>
        </label>
        <p className="text-small text-text-muted" id={`${titleId}-hint`}>
          Use ↑ ↓ to move, Enter to open, Esc to close.
          {user.role === USER_ROLE.SUPER_ADMIN
            ? ' Dashboard and Operations are separate destinations.'
            : null}
        </p>

        {query.trim().length === 0 && recentSearches.length > 0 ? (
          <section aria-label="Recent searches">
            <h3 className="mb-wilms-2 px-1 text-small font-semibold uppercase tracking-wide text-text-muted">
              Recent
            </h3>
            <ul className="flex flex-wrap gap-wilms-2">
              {recentSearches.map((entry) => (
                <li key={`${entry.query}-${entry.at}`}>
                  <button
                    type="button"
                    className="rounded-full border border-border bg-background px-wilms-3 py-wilms-1 text-small text-text-muted transition-colors hover:border-brand-primary/40 hover:text-text-primary"
                    onClick={() => setQuery(entry.query)}
                  >
                    {entry.query}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div
          id={`${titleId}-results`}
          aria-live="polite"
          aria-labelledby={`${titleId}-hint`}
          className="max-h-[min(32rem,58vh)] space-y-wilms-4 overflow-auto"
          role="listbox"
          aria-activedescendant={
            commandItems[activeIndex] ? `search-option-${commandItems[activeIndex]!.id}` : undefined
          }
        >
          {query.trim().length >= 1 && isFetching ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}

          {isError ? (
            <div
              className="rounded-xl border border-danger/30 bg-danger/5 px-wilms-4 py-wilms-4"
              role="alert"
            >
              <p className="font-semibold text-text-primary">We couldn&apos;t complete that search</p>
              <p className="mt-1 text-small text-text-muted">
                Your connection may have been interrupted. Try again in a moment.
              </p>
            </div>
          ) : null}

          {!isFetching && !isError && commandItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-wilms-4 py-wilms-8 text-center">
              <p className="text-body font-semibold text-text-primary">No matches</p>
              <p className="mt-1 text-small text-text-muted">
                Try a page name, borrower, group, loan reference, or report title.
              </p>
            </div>
          ) : null}

          {groupedCommands.map(([group, items]) => (
            <section key={group} aria-label={group}>
              <h3 className="mb-wilms-2 px-1 text-small font-semibold uppercase tracking-wide text-text-muted">
                {group}
              </h3>
              <ul className="overflow-hidden rounded-xl border border-border bg-card divide-y divide-border">
                {items.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={item.id}
                      role="option"
                      aria-selected={isActive}
                      id={`search-option-${item.id}`}
                    >
                      <button
                        type="button"
                        className={cn(
                          'flex w-full items-center gap-wilms-3 px-wilms-4 py-wilms-3 text-left',
                          'transition-colors hover:bg-background',
                          isActive && 'bg-brand-primary-light/50 ring-1 ring-inset ring-brand-primary/25',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary',
                        )}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => {
                          pushRecentSearch(query);
                          setRecentSearches(readRecentSearches());
                          closeGlobalSearch();
                          router.push(item.href);
                        }}
                      >
                        {group === 'Navigation' ? (
                          <NavigationGlyph href={item.href} />
                        ) : (
                          <Avatar
                            label={item.label}
                            photoUrl={resolveEntityPhotoUrl({
                              name: item.label,
                              id: item.id,
                            })}
                            size="sm"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-body font-semibold text-text-primary">
                            <HighlightedText text={item.label} query={query} />
                          </p>
                          {item.subtitle ? (
                            <p className="truncate text-small text-text-muted">
                              <HighlightedText text={item.subtitle} query={query} />
                            </p>
                          ) : null}
                        </div>
                        {group === 'Navigation' ? (
                          <span className="shrink-0 text-small text-text-muted" aria-hidden="true">
                            →
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function GlobalSearchTrigger({
  variant = 'compact',
  className,
}: {
  variant?: 'desktop' | 'compact';
  className?: string;
}) {
  const openGlobalSearch = useUiStore((state) => state.openGlobalSearch);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        openGlobalSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openGlobalSearch]);

  if (variant === 'desktop') {
    return (
      <button
        type="button"
        className={cn(
          'inline-flex h-9 w-full max-w-full items-center gap-2.5 rounded-xl border border-border/80 bg-slate-100/70 px-3.5 text-small text-text-muted dark:bg-white/5',
          'transition-all hover:border-brand-primary/40 hover:bg-card hover:text-text-primary hover:shadow-xs',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
          className,
        )}
        onClick={openGlobalSearch}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">Search WILMS…</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary xl:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-border bg-background text-text-muted',
        'transition-colors hover:text-text-primary px-2 md:gap-2 md:px-3',
        className,
      )}
      onClick={openGlobalSearch}
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only md:not-sr-only md:inline">Search</span>
    </button>
  );
}
