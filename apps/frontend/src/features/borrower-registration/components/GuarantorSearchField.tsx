'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { borrowerService } from '@/services';
import type { GuarantorLookupResult, GuarantorSearchHit } from '@/types/guarantor-search';
import { cn } from '@/utils/cn';

const DEBOUNCE_MS = 300;
const MIN_CHARS = 2;

export interface GuarantorSearchFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  hasError?: boolean;
  disabled?: boolean;
  borrowerPhone?: string;
  borrowerIdNumber?: string;
  selected: GuarantorLookupResult | null;
  onSelected: (lookup: GuarantorLookupResult | null) => void;
  onManualEntry: () => void;
  isManualEntry: boolean;
}

export function GuarantorSearchField({
  id,
  value,
  onChange,
  onBlur,
  hasError = false,
  disabled = false,
  borrowerPhone,
  borrowerIdNumber,
  selected,
  onSelected,
  onManualEntry,
  isManualEntry,
}: GuarantorSearchFieldProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<GuarantorSearchHit[]>([]);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (selected || isManualEntry) {
      setOpen(false);
      setHits([]);
      return;
    }

    const query = value.trim();
    if (query.length < MIN_CHARS) {
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      const requestId = ++requestIdRef.current;
      void borrowerService
        .searchGuarantors(query, { borrowerPhone, borrowerIdNumber })
        .then((results) => {
          if (requestId !== requestIdRef.current) return;
          setHits(results);
          setHighlightIndex(0);
          setOpen(true);
        })
        .catch(() => {
          if (requestId !== requestIdRef.current) return;
          setHits([]);
          setOpen(true);
        })
        .finally(() => {
          if (requestId === requestIdRef.current) {
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [value, selected, isManualEntry, borrowerPhone, borrowerIdNumber]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const selectHit = async (hit: GuarantorSearchHit) => {
    setLookupError(null);
    setLoading(true);
    try {
      const lookup = await borrowerService.lookupGuarantor(hit.phone, {
        borrowerPhone,
        borrowerIdNumber,
      });
      onChange(lookup.name);
      onSelected(lookup);
      setOpen(false);
    } catch {
      setLookupError('Unable to load this guarantor record. Try again or enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  const clearSelection = () => {
    onSelected(null);
    onChange('');
    setLookupError(null);
  };

  const optionCount = hits.length + 1; // + manual entry

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter') && value.trim().length >= MIN_CHARS) {
      setOpen(true);
    }

    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }

    if (!open) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((index) => (index + 1) % optionCount);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((index) => (index - 1 + optionCount) % optionCount);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightIndex < hits.length) {
        void selectHit(hits[highlightIndex]!);
      } else {
        onManualEntry();
        setOpen(false);
      }
    }
  };

  if (selected) {
    return (
      <div className="space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-3">
        <p className="text-small font-semibold text-status-success">✓ Existing guarantor found</p>
        <div className="space-y-wilms-1 text-body text-text-primary">
          <p className="font-semibold">{selected.name}</p>
          {selected.displayId ? <p className="text-small text-text-muted">{selected.displayId}</p> : null}
          <p className="text-small">Phone: {selected.phoneDisplay}</p>
          {selected.idType ? (
            <p className="text-small">ID: {selected.idType.replace(/_/g, ' ')}</p>
          ) : null}
          {selected.community ? (
            <p className="text-small">Community: {selected.community}</p>
          ) : null}
          <p className="text-small">
            Current guarantees: {selected.eligibility.activeGuaranteeCount} of{' '}
            {selected.eligibility.maxGuarantees}
            {selected.eligibility.isEligible ? ' · ✓ Eligible' : ' · ⚠ Not eligible'}
          </p>
        </div>
        <p className="text-small text-text-muted">
          Details are loaded from the existing WILMS record and cannot be edited here. Use a
          borrower update request if corrections are needed.
        </p>
        <Button type="button" variant="ghost" size="sm" onClick={clearSelection} disabled={disabled}>
          Clear selection
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative space-y-wilms-2">
      <Input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={open ? `${listboxId}-option-${highlightIndex}` : undefined}
        hasError={hasError}
        disabled={disabled}
        value={value}
        autoComplete="off"
        placeholder="Type at least 2 characters to search"
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (value.trim().length >= MIN_CHARS) setOpen(true);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />

      {loading ? <p className="text-small text-text-muted">Searching…</p> : null}
      {lookupError ? (
        <p className="text-small text-danger" role="alert">
          {lookupError}
        </p>
      ) : null}

      {isManualEntry ? (
        <p className="text-small text-text-muted">
          Entering guarantor manually.{' '}
          <button
            type="button"
            className="underline"
            onClick={() => {
              onSelected(null);
              onChange(value);
            }}
          >
            Search again
          </button>
        </p>
      ) : null}

      {open && !selected && !isManualEntry ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-sm border border-border bg-card p-1 shadow-lg"
        >
          {hits.length === 0 && !loading ? (
            <li className="px-wilms-3 py-wilms-2 text-small text-text-muted">
              No matching guarantor found
            </li>
          ) : null}
          {hits.map((hit, index) => (
            <li key={hit.key} role="presentation">
              <button
                type="button"
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={highlightIndex === index}
                className={cn(
                  'flex w-full flex-col gap-0.5 rounded-sm px-wilms-3 py-wilms-2 text-left',
                  highlightIndex === index ? 'bg-background' : 'bg-card hover:bg-background',
                )}
                onMouseEnter={() => setHighlightIndex(index)}
                onClick={() => void selectHit(hit)}
              >
                <span className="font-semibold text-text-primary">{hit.name}</span>
                {hit.displayId ? (
                  <span className="text-small text-text-muted">{hit.displayId}</span>
                ) : null}
                <span className="text-small text-text-muted">{hit.phoneDisplay}</span>
                {hit.groupName || hit.community ? (
                  <span className="text-small text-text-muted">
                    {[hit.groupName, hit.community].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
                <span className="text-small text-text-muted">
                  Guarantees: {hit.activeGuaranteeCount} of {hit.maxGuarantees}
                  {hit.isBlacklisted
                    ? ' · Blacklisted'
                    : hit.isEligiblePreview
                      ? ' · Eligible'
                      : ' · At capacity'}
                </span>
              </button>
            </li>
          ))}
          <li role="presentation" className="border-t border-border">
            <button
              type="button"
              id={`${listboxId}-option-${hits.length}`}
              role="option"
              aria-selected={highlightIndex === hits.length}
              className={cn(
                'flex w-full flex-col gap-0.5 rounded-sm px-wilms-3 py-wilms-2 text-left',
                highlightIndex === hits.length ? 'bg-background' : 'bg-card hover:bg-background',
              )}
              onMouseEnter={() => setHighlightIndex(hits.length)}
              onClick={() => {
                onManualEntry();
                setOpen(false);
              }}
            >
              <span className="text-small text-text-muted">No matching guarantor?</span>
              <span className="font-semibold text-text-primary">+ Enter guarantor manually</span>
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
