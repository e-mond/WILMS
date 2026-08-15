'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/feedback/EmptyState';
import { apiClient } from '@/utils/apiClient';

export interface RecordSearchHit {
  kind: 'borrower' | 'guarantor' | 'group_leader';
  id: string;
  label: string;
  subtitle: string;
  href: string;
}

export function RecordsSearchPanel() {
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const searchQuery = useQuery({
    queryKey: ['records', 'search', trimmed],
    queryFn: () => apiClient.get<RecordSearchHit[]>(`/records/search?q=${encodeURIComponent(trimmed)}`),
    enabled: trimmed.length >= 2,
  });

  const hits = useMemo(() => searchQuery.data ?? [], [searchQuery.data]);

  return (
    <div className="space-y-wilms-4">
      <Input
        aria-label="Search borrower records"
        placeholder="Search by name, borrower ID, phone, Ghana Card, guarantor, group, collector, or community"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {trimmed.length < 2 ? (
        <EmptyState
          title="Search the loan file archive"
          description="Enter at least two characters. Results include borrowers, guarantors, and group leaders."
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
                <p className="text-body font-semibold text-text-primary">{hit.label}</p>
                <p className="text-caption text-text-muted">
                  {hit.kind.replace('_', ' ')} · {hit.subtitle}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
