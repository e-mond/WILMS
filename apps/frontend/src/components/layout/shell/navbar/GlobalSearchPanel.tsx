'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { Search } from 'lucide-react';
import { HighlightedText } from '@/components/feedback/HighlightedText';
import { cn } from '@/utils/cn';

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

const ENTITY_ORDER: GlobalSearchEntityType[] = [
  GLOBAL_SEARCH_ENTITY.BORROWER,
  GLOBAL_SEARCH_ENTITY.GROUP,
  GLOBAL_SEARCH_ENTITY.LOAN,
  GLOBAL_SEARCH_ENTITY.LOAN_POOL,
  GLOBAL_SEARCH_ENTITY.PAYMENT,
  GLOBAL_SEARCH_ENTITY.APPLICATION,
  GLOBAL_SEARCH_ENTITY.REGISTRATION,
  GLOBAL_SEARCH_ENTITY.COLLECTOR,
  GLOBAL_SEARCH_ENTITY.USER,
  GLOBAL_SEARCH_ENTITY.REPORT,
  GLOBAL_SEARCH_ENTITY.RISK_FLAG,
  GLOBAL_SEARCH_ENTITY.AUDIT_LOG,
];

function groupSearchResults(
  results: GlobalSearchResult[],
): Array<{ entityType: GlobalSearchEntityType; label: string; items: GlobalSearchResult[] }> {
  const map = new Map<GlobalSearchEntityType, GlobalSearchResult[]>();
  for (const result of results) {
    const list = map.get(result.entityType) ?? [];
    list.push(result);
    map.set(result.entityType, list);
  }

  return ENTITY_ORDER.filter((type) => map.has(type)).map((entityType) => ({
    entityType,
    label: ENTITY_LABELS[entityType],
    items: map.get(entityType) ?? [],
  }));
}

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
    return result.status ?? ENTITY_LABELS[result.entityType]?.replace(/s$/, '') ?? 'Record';
  }
  return result.subtitle;
}

export function GlobalSearchPanel() {
  const titleId = useId();
  const router = useRouter();
  const { user } = useAuth();
  const isOpen = useUiStore((state) => state.isGlobalSearchOpen);
  const closeGlobalSearch = useUiStore((state) => state.closeGlobalSearch);
  const [query, setQuery] = useState('');

  const { data: results = [], isFetching } = useGlobalSearch(
    {
      query,
      role: user!.role,
      limit: 12,
    },
    Boolean(user) && isOpen,
  );

  const grouped = useMemo(() => groupSearchResults(results), [results]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    }
  }, [isOpen]);

  if (!user) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeGlobalSearch}
      title="Search WILMS"
      className="max-w-2xl"
    >
      <div className="space-y-wilms-4">
        <label className="block" htmlFor={`${titleId}-search`}>
          <span className="sr-only">Search WILMS records</span>
          <Input
            id={`${titleId}-search`}
            type="search"
            value={query}
            placeholder={getGlobalSearchPlaceholder(user.role)}
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <p className="text-small text-text-muted">
          Search navigation, people, loans, reports, and settings. Results are grouped by type.
          Press <kbd className="rounded border border-border px-1">Esc</kbd> to close.
        </p>

        {query.trim().length >= 1 ? (
          <div aria-live="polite" className="max-h-[min(24rem,55vh)] space-y-wilms-3 overflow-auto">
            {isFetching ? (
              <div className="space-y-2" aria-busy="true">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-md border border-dashed border-border px-wilms-4 py-wilms-6 text-center">
                <p className="text-body font-medium text-text-primary">No results found</p>
                <p className="mt-1 text-small text-text-muted">
                  Try a borrower name, group name, loan reference, or report title.
                </p>
              </div>
            ) : (
              grouped.map((group) => (
                <section key={group.entityType} aria-label={group.label}>
                  <h3 className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
                    {group.label}
                  </h3>
                  <ul className="overflow-hidden rounded-md border border-border divide-y divide-border">
                    {group.items.map((result) => {
                      const subtitle = humanReadableSubtitle(result);
                      return (
                        <li key={`${result.entityType}-${result.id}`}>
                          <Link
                            href={result.href}
                            className={cn(
                              'flex items-center gap-wilms-3 px-wilms-4 py-wilms-3',
                              'transition-colors hover:bg-background',
                              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary',
                            )}
                            onClick={() => {
                              closeGlobalSearch();
                              router.push(result.href);
                            }}
                          >
                            <Avatar
                              label={result.label}
                              photoUrl={resolveEntityPhotoUrl({
                                name: result.label,
                                id: result.id,
                                photoUrl: result.photoUrl,
                              })}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-body font-semibold text-text-primary">
                                <HighlightedText text={result.label} query={query} />
                              </p>
                              {subtitle ? (
                                <p className="truncate text-small text-text-muted">
                                  <HighlightedText text={subtitle} query={query} />
                                </p>
                              ) : null}
                            </div>
                            {result.actionLabel ? (
                              <p className="shrink-0 text-small font-semibold text-brand-primary">
                                {result.actionLabel}
                              </p>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        ) : (
          <p className="text-small text-text-muted">
            Tip: use names and human-readable references. Internal IDs are never shown as primary
            labels.
          </p>
        )}
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
          'inline-flex h-9 w-full items-center gap-2 rounded-md border border-border bg-background px-3 text-small text-text-muted',
          'transition-colors hover:border-brand-primary/40 hover:text-text-primary',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
          className,
        )}
        onClick={openGlobalSearch}
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-left">Search WILMS…</span>
        <kbd className="hidden shrink-0 rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary lg:inline">
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
      <kbd className="hidden rounded border border-border px-1 text-[10px] xl:inline">⌘K</kbd>
    </button>
  );
}
