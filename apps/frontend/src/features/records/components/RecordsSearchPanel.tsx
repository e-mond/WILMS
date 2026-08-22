'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/feedback/EmptyState';
import { Input } from '@/components/ui/Input';
import { apiClient } from '@/utils/apiClient';

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

export function RecordsSearchPanel() {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const trimmed = query.trim();

  useEffect(() => {
    setRecent(readRecentSearches());
  }, []);

  const searchQuery = useQuery({
    queryKey: ['records', 'search', trimmed],
    queryFn: () => apiClient.get<RecordSearchHit[]>(`/records/search?q=${encodeURIComponent(trimmed)}`),
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
    <div className="space-y-wilms-4">
      <Input
        aria-label="Search borrower records"
        placeholder="Search by name, borrower ID, phone, Ghana Card, guarantor, group, or community"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {trimmed.length < 2 && recent.length > 0 ? (
        <div className="rounded-sm border border-border bg-card p-wilms-3">
          <p className="text-caption font-semibold uppercase tracking-wide text-text-muted">
            Recent searches
          </p>
          <ul className="mt-wilms-2 flex flex-wrap gap-wilms-2">
            {recent.map((entry) => (
              <li key={entry}>
                <button
                  type="button"
                  className="rounded-full border border-border px-wilms-3 py-wilms-1 text-small text-text-primary hover:bg-surface-muted"
                  onClick={() => setQuery(entry)}
                >
                  {entry}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {trimmed.length < 2 ? (
        <EmptyState
          title="Search the loan file archive"
          description="Enter at least two characters. Search borrowers by name, ID, or phone; search guarantors by name or phone."
        />
      ) : searchQuery.isFetching ? (
        <p className="text-small text-text-muted">Searching…</p>
      ) : hits.length === 0 ? (
        <EmptyState title="No matching records" description="Try another name, phone, Ghana Card, or group." />
      ) : (
        <ul className="divide-y divide-border rounded-sm border border-border bg-card">
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <Link href={hit.href} className="block px-wilms-4 py-wilms-3 hover:bg-surface-muted">
                <div className="flex items-center justify-between gap-wilms-3">
                  <div>
                    <p className="text-body font-semibold text-text-primary">{hit.label}</p>
                    <p className="text-caption text-text-muted">
                      {hit.kind === 'guarantor' ? 'Guarantor' : 'Borrower'} · {hit.subtitle}
                    </p>
                  </div>
                  {hit.kind === 'guarantor' && hit.activeGuaranteeCount !== undefined ? (
                    <span className="text-caption font-semibold text-text-muted">
                      {hit.activeGuaranteeCount}/{hit.maxGuarantees ?? 3}
                    </span>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
