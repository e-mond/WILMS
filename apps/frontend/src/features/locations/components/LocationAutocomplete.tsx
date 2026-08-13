'use client';


import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/Input';
import locationService from '@/services/locationService';
import { cn } from '@/utils/cn';

export interface LocationAutocompleteHit {
  type: string;
  id: string;
  name: string;
  score?: number;
  districtId?: string | null;
  regionId?: string | null;
  aliases?: string[];
}

interface LocationAutocompleteProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (hit: LocationAutocompleteHit) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Restrict remote and local results to these entity types. */
  entityTypes?: Array<'region' | 'district' | 'sub_district_unit' | 'electoral_area' | 'community'>;
  /** Prefer / restrict community hits to this MMDA. */
  districtId?: string;
  /** Offline-first / cascade-scoped candidates (e.g. communities already loaded for the MMDA). */
  localOptions?: Array<{ id: string; name: string; aliases?: string[]; districtId?: string | null }>;
  inputId?: string;
  hasError?: boolean;
  hideLabel?: boolean;
}

function scoreLocalOption(query: string, name: string, aliases: string[] = []): number {
  const normalisedQuery = query.trim().toLowerCase();
  const normalisedName = name.toLowerCase();
  if (!normalisedQuery) {
    return 0;
  }
  if (normalisedName === normalisedQuery) {
    return 1;
  }
  if (normalisedName.startsWith(normalisedQuery)) {
    return 0.92;
  }
  if (normalisedName.includes(normalisedQuery)) {
    return 0.8;
  }
  if (aliases.some((alias) => alias.toLowerCase().includes(normalisedQuery))) {
    return 0.75;
  }
  return 0;
}

export function LocationAutocomplete({
  label = 'Search locality',
  value,
  onChange,
  onSelect,
  placeholder = 'Search community…',
  disabled,
  entityTypes,
  districtId,
  localOptions = [],
  inputId,
  hasError,
  hideLabel,
}: LocationAutocompleteProps) {
  const generatedId = useId();
  const listId = inputId ?? generatedId;
  const [hits, setHits] = useState<LocationAutocompleteHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entityTypesKey = entityTypes?.join(',') ?? '';
  const localOptionsKey = useMemo(
    () => localOptions.map((option) => `${option.id}:${option.name}`).join('|'),
    [localOptions],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    const query = value.trim();
    if (query.length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }

    const localHits = localOptions
      .map((option) => ({
        type: 'community',
        id: option.id,
        name: option.name,
        districtId: option.districtId ?? districtId ?? null,
        aliases: option.aliases ?? [],
        score: scoreLocalOption(query, option.name, option.aliases ?? []),
      }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .slice(0, 12);

    if (localHits.length > 0) {
      setHits(localHits);
      setOpen(true);
      setActiveIndex(0);
    }

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      void locationService
        .autocomplete(query, 12, { types: entityTypes, districtId })
        .then((response) => {
          const remote = response.data.filter((hit) => {
            if (entityTypes?.length && !entityTypes.includes(hit.type as (typeof entityTypes)[number])) {
              return false;
            }
            if (districtId && hit.type === 'community' && hit.districtId && hit.districtId !== districtId) {
              return false;
            }
            return true;
          });
          const merged = new Map<string, LocationAutocompleteHit>();
          for (const hit of [...localHits, ...remote]) {
            merged.set(`${hit.type}:${hit.id}`, hit);
          }
          const next = Array.from(merged.values())
            .sort((a, b) => (b.score ?? 0) - (a.score ?? 0) || a.name.localeCompare(b.name))
            .slice(0, 12);
          setHits(next);
          setOpen(next.length > 0);
          setActiveIndex(0);
        })
        .catch(() => {
          if (localHits.length === 0) {
            setHits([]);
            setOpen(false);
          }
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // localOptionsKey / entityTypesKey stabilise referential churn from inline arrays.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable keys
  }, [value, entityTypesKey, districtId, localOptionsKey]);

  const activeHit = useMemo(() => hits[activeIndex] ?? null, [hits, activeIndex]);

  return (
    <div className="relative">
      {hideLabel ? null : (
        <label htmlFor={listId} className="text-small font-semibold text-text-primary">
          {label}
        </label>
      )}
      <Input
        id={listId}
        className={hideLabel ? undefined : 'mt-wilms-2'}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-listbox`}
        aria-autocomplete="list"
        aria-activedescendant={activeHit ? `${listId}-option-${activeIndex}` : undefined}
        aria-invalid={hasError || undefined}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (hits.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (!open || hits.length === 0) {
            return;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, hits.length - 1));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
          } else if (event.key === 'Enter' && activeHit) {
            event.preventDefault();
            onChange(activeHit.name);
            onSelect?.(activeHit);
            setOpen(false);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {loading ? <p className="mt-wilms-1 text-small text-text-muted">Searching…</p> : null}
      {open ? (
        <ul
          id={`${listId}-listbox`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-sm border border-border bg-card py-1 text-text-primary shadow-lg"
        >
          {hits.map((hit, index) => (
            <li
              key={`${hit.type}:${hit.id}`}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'cursor-pointer px-3 py-2 text-small',
                index === activeIndex
                  ? 'bg-brand-primary-light text-brand-primary'
                  : 'bg-card text-text-secondary hover:bg-background hover:text-text-primary',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(hit.name);
                onSelect?.(hit);
                setOpen(false);
              }}
            >
              <span className="font-semibold text-text-primary">{hit.name}</span>
              <span className="ml-2 text-text-muted">{hit.type.replaceAll('_', ' ')}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
