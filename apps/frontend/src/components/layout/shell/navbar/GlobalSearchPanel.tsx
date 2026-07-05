'use client';

import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/data-display/Avatar';
import { resolveEntityPhotoUrl } from '@/utils/entity-photo';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useGlobalSearch } from '@/features/global-search/hooks/useGlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { useUiStore } from '@/state/uiStore';
import type { GlobalSearchEntityType } from '@/types/search';
import { GLOBAL_SEARCH_ENTITY } from '@/types/search';
import { getGlobalSearchPlaceholder } from '@/utils/global-search-scope';
import { Search } from 'lucide-react';
import { HighlightedText } from '@/components/feedback/HighlightedText';
import { cn } from '@/utils/cn';

const ENTITY_LABELS: Record<GlobalSearchEntityType, string> = {
  [GLOBAL_SEARCH_ENTITY.BORROWER]: 'Borrower',
  [GLOBAL_SEARCH_ENTITY.GROUP]: 'Group',
  [GLOBAL_SEARCH_ENTITY.COLLECTOR]: 'Collector',
  [GLOBAL_SEARCH_ENTITY.LOAN_POOL]: 'Loan Pool',
  [GLOBAL_SEARCH_ENTITY.LOAN]: 'Loan',
  [GLOBAL_SEARCH_ENTITY.REPORT]: 'Report',
  [GLOBAL_SEARCH_ENTITY.USER]: 'User',
  [GLOBAL_SEARCH_ENTITY.REGISTRATION]: 'Registration',
  [GLOBAL_SEARCH_ENTITY.PAYMENT]: 'Payment',
  [GLOBAL_SEARCH_ENTITY.APPLICATION]: 'Application',
  [GLOBAL_SEARCH_ENTITY.AUDIT_LOG]: 'Audit Log',
  [GLOBAL_SEARCH_ENTITY.RISK_FLAG]: 'Risk Flag',
};

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
      limit: 8,
    },
    Boolean(user) && isOpen,
  );

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
          Search by name, phone, ID, loan reference, or collector. Type at least 1 character.
        </p>

        {query.trim().length >= 1 ? (
          <div aria-live="polite" className="space-y-wilms-2">
            {isFetching ? (
              <p className="text-body text-text-muted">Searching...</p>
            ) : results.length === 0 ? (
              <p className="text-body text-text-muted">No results found.</p>
            ) : (
              <ul className="divide-y divide-border rounded-sm border border-border">
                {results.map((result) => (
                  <li key={`${result.entityType}-${result.id}`}>
                    <Link
                      href={result.href}
                      className={cn(
                        'flex items-center gap-wilms-3 px-wilms-4 py-wilms-3',
                        'hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary',
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
                        {result.subtitle ? (
                          <p className="truncate text-small text-text-muted">
                            <HighlightedText text={result.subtitle} query={query} />
                          </p>
                        ) : null}
                        {result.status ? (
                          <p className="text-small font-semibold text-brand-primary">{result.status}</p>
                        ) : null}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="rounded-sm border border-border px-wilms-2 py-wilms-1 text-small text-text-muted">
                          {ENTITY_LABELS[result.entityType]}
                        </span>
                        {result.actionLabel ? (
                          <p className="mt-wilms-1 text-small font-semibold text-brand-primary">
                            {result.actionLabel}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export function GlobalSearchTrigger({ variant = 'compact' }: { variant?: 'desktop' | 'compact' }) {
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
        className="inline-flex min-h-[44px] items-center gap-wilms-2 rounded-sm border border-border bg-background px-wilms-3 py-wilms-2 text-small text-text-muted hover:text-text-primary"
        onClick={openGlobalSearch}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>Search WILMS</span>
        <kbd className="hidden rounded-sm border border-border px-wilms-1 text-small lg:inline">Ctrl K</kbd>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm border border-border bg-background text-text-muted hover:text-text-primary',
        'px-wilms-2 md:gap-wilms-2 md:px-wilms-3',
      )}
      onClick={openGlobalSearch}
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only md:not-sr-only md:inline">Search</span>
      <kbd className="hidden rounded-sm border border-border px-wilms-1 text-small xl:inline">Ctrl K</kbd>
    </button>
  );
}
