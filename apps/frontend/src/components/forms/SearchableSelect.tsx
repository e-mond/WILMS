'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

export interface SearchableSelectOption {
  value: string;
  label: string;
  category?: string;
}

export interface SearchableSelectProps {
  id: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  /** When the current value is not in options (legacy free-text), show this label. */
  fallbackLabel?: string;
  className?: string;
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  onBlur,
  placeholder = 'Search or select…',
  hasError = false,
  disabled = false,
  emptyMessage = 'No matching options.',
  fallbackLabel,
  className,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const displayValue = open
    ? query
    : selected?.label ?? (value ? fallbackLabel ?? value : '');

  const filtered = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    if (!normalised) {
      return options.slice(0, 50);
    }

    return options
      .map((option) => {
        const label = option.label.toLowerCase();
        const category = option.category?.toLowerCase() ?? '';
        let score = 0;
        if (label === normalised) score = 100;
        else if (label.startsWith(normalised)) score = 90;
        else if (label.includes(normalised)) score = 75;
        else if (category.includes(normalised)) score = 40;
        return { option, score };
      })
      .filter((entry) => entry.score > 0)
      .sort(
        (left, right) =>
          right.score - left.score || left.option.label.localeCompare(right.option.label),
      )
      .slice(0, 50)
      .map((entry) => entry.option);
  }, [options, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  function selectOption(option: SearchableSelectOption) {
    onChange(option.value);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-invalid={hasError || undefined}
          hasError={hasError}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          autoComplete="off"
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              setQuery('');
            }
          }}
          onBlur={() => {
            onBlur?.();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
              setOpen(true);
              return;
            }

            if (event.key === 'Escape') {
              setOpen(false);
              setQuery('');
              return;
            }

            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)));
              return;
            }

            if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
              return;
            }

            if (event.key === 'Enter' && filtered[activeIndex]) {
              event.preventDefault();
              selectOption(filtered[activeIndex]!);
            }
          }}
          className="pr-10"
        />
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
          aria-hidden="true"
        />
      </div>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-card shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-wilms-3 py-wilms-3 text-small text-text-muted">{emptyMessage}</li>
          ) : (
            filtered.map((option, index) => {
              const active = index === activeIndex;
              const selectedOption = option.value === value;
              return (
                <li key={option.value} role="option" aria-selected={selectedOption}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 px-wilms-3 py-2 text-left text-body',
                      'min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-primary',
                      active || selectedOption
                        ? 'bg-brand-primary/10 text-brand-primary'
                        : 'text-text-primary hover:bg-background',
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.category ? (
                      <span className="text-small text-text-muted">{option.category}</span>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
