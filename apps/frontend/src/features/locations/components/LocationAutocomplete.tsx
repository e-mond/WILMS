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
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (hit: LocationAutocompleteHit) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function LocationAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Search locality…',
  disabled,
}: LocationAutocompleteProps) {
  const listId = useId();
  const [hits, setHits] = useState<LocationAutocompleteHit[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      void locationService
        .autocomplete(query, 12)
        .then((response) => {
          setHits(response.data);
          setOpen(response.data.length > 0);
          setActiveIndex(0);
        })
        .catch(() => {
          setHits([]);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 180);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  const activeHit = useMemo(() => hits[activeIndex] ?? null, [hits, activeIndex]);

  return (
    <div className="relative">
      <label htmlFor={listId} className="text-small font-semibold text-text-primary">
        {label}
      </label>
      <Input
        id={listId}
        className="mt-wilms-2"
        role="combobox"
        aria-expanded={open}
        aria-controls={`${listId}-listbox`}
        aria-autocomplete="list"
        aria-activedescendant={activeHit ? `${listId}-option-${activeIndex}` : undefined}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface shadow-lg"
        >
          {hits.map((hit, index) => (
            <li
              key={`${hit.type}:${hit.id}`}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                'cursor-pointer px-3 py-2 text-small',
                index === activeIndex ? 'bg-primary/10 text-text-primary' : 'text-text-secondary',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(hit.name);
                onSelect?.(hit);
                setOpen(false);
              }}
            >
              <span className="font-semibold">{hit.name}</span>
              <span className="ml-2 text-text-muted">{hit.type.replaceAll('_', ' ')}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
