'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Clock3,
  FileSearch,
  Search,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { EmptyState } from '@/components/feedback/EmptyState';
import { TourPageTip } from '@/components/onboarding/TourPageTip';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/utils/apiClient';
import { cn } from '@/utils/cn';

const RECENT_SEARCH_KEY = 'wilms.records.search.recent';
const RECENT_SEARCH_LIMIT = 8;

export interface RecordSearchHit {
  kind: 'borrower' | 'guarantor' | 'group_leader';
  id: string;
  label: string;
  subtitle: string;
  href: string;
  activeGuaranteeCount?: number;
  maxGuarantees?: number;
}

function readRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENT_SEARCH_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function rememberSearch(query: string) {
  if (typeof window === 'undefined' || query.trim().length < 2) return;
  const trimmed = query.trim();
  const next = [trimmed, ...readRecentSearches().filter((entry) => entry !== trimmed)].slice(
    0,
    RECENT_SEARCH_LIMIT,
  );
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
}

function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(RECENT_SEARCH_KEY);
}

function removeRecentSearch(query: string) {
  if (typeof window === 'undefined') return;
  const next = readRecentSearches().filter((entry) => entry !== query);
  window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
}

function kindLabel(kind: RecordSearchHit['kind']): string {
  if (kind === 'guarantor') return 'Guarantor';
  if (kind === 'group_leader') return 'Group leader';
  return 'Borrower';
}

function KindIcon({ kind }: { kind: RecordSearchHit['kind'] }) {
  if (kind === 'guarantor') {
    return <UsersRound className="h-4 w-4" aria-hidden="true" />;
  }
  return <UserRound className="h-4 w-4" aria-hidden="true" />;
}

export function RecordsSearchPanel() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  const searchQuery = useQuery({
    queryKey: ['records', 'search', trimmed],
    queryFn: () =>
      apiClient.get<RecordSearchHit[]>(`/records/search?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length >= 2,
  });

  useEffect(() => {
    if (searchQuery.isSuccess && trimmed.length >= 2) {
      rememberSearch(trimmed);
      setRecent(readRecentSearches());
    }
  }, [searchQuery.isSuccess, trimmed]);

  const hits = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  return (
    <div className="space-y-wilms-5" data-testid="records-search-panel" data-tour="records-search">
      <TourPageTip pageKey="records" />
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.07] via-transparent to-transparent px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Loan file archive
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                Borrower Records
              </h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Find borrowers, guarantors, and group leaders by name, ID, phone, Ghana Card, or
                community.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small text-text-muted">
              <FileSearch className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              Full KYC & loan history
            </div>
          </div>

          <div className="relative mt-wilms-5">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-primary"
              aria-hidden="true"
            />
            <Input
              aria-label="Search borrower records"
              className="h-12 rounded-xl border-border/80 bg-background pl-11 pr-10 text-body"
              placeholder="Search by name, borrower ID, phone, Ghana Card, guarantor, group…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-text-muted hover:bg-border/60 hover:text-text-primary"
                onClick={() => setQuery('')}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {trimmed.length < 2 && recent.length > 0 ? (
        <section
          className="rounded-xl border border-border/80 bg-card p-wilms-4"
          aria-label="Recent searches"
        >
          <div className="flex items-center justify-between gap-wilms-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-brand-primary">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-body font-semibold text-text-primary">Recent searches</h2>
                <p className="text-small text-text-muted">Pick up where you left off</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
            >
              Clear all
            </Button>
          </div>
          <ul className="mt-wilms-3 flex flex-wrap gap-2">
            {recent.map((entry) => (
              <li key={entry}>
                <div className="inline-flex items-center overflow-hidden rounded-full border border-border bg-background">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-small font-medium text-text-primary hover:bg-brand-primary/5"
                    onClick={() => setQuery(entry)}
                  >
                    {entry}
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove recent search ${entry}`}
                    className="border-l border-border px-2 py-1.5 text-text-muted hover:bg-danger/5 hover:text-danger"
                    onClick={() => {
                      removeRecentSearch(entry);
                      setRecent(readRecentSearches());
                    }}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {trimmed.length < 2 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/60 px-wilms-5 py-wilms-8">
          <EmptyState
            title="Search the loan file archive"
            description="Enter at least two characters. Search borrowers by name, ID, or phone; search guarantors by name or phone."
          />
        </div>
      ) : searchQuery.isFetching ? (
        <p className="text-small text-text-muted" aria-live="polite">
          Searching…
        </p>
      ) : hits.length === 0 ? (
        <EmptyState
          title="No matching records"
          description="Try another name, phone, Ghana Card, or group."
        />
      ) : (
        <ul className="space-y-wilms-2" aria-label="Search results">
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <Link
                href={hit.href}
                className="group flex items-center justify-between gap-wilms-3 rounded-xl border border-border/80 bg-card px-wilms-4 py-wilms-3 transition-colors hover:border-brand-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
              >
                <div className="flex min-w-0 items-start gap-wilms-3">
                  <span
                    className={cn(
                      'mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border',
                      hit.kind === 'guarantor'
                        ? 'border-sky-100 bg-sky-50 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/40 dark:text-sky-400'
                        : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-400',
                    )}
                  >
                    <KindIcon kind={hit.kind} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-body font-semibold text-text-primary">
                        {hit.label}
                      </p>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-text-muted">
                        {kindLabel(hit.kind)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-small text-text-muted">{hit.subtitle}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-wilms-2">
                  {hit.kind === 'guarantor' && hit.activeGuaranteeCount !== undefined ? (
                    <span className="text-small font-semibold tabular-nums text-text-muted">
                      {hit.activeGuaranteeCount}/{hit.maxGuarantees ?? 3}
                    </span>
                  ) : null}
                  <ArrowRight
                    className="h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
