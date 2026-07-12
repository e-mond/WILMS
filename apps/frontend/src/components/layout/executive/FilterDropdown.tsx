'use client';

import type { ReactNode } from 'react';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';
import type { FilterPillOption } from '@/components/layout/executive/FilterPillBar';

export interface FilterDropdownProps {
  label: string;
  options: FilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterDropdownProps) {
  return (
    <label className={cn('flex min-w-[9rem] flex-col gap-wilms-1', className)}>
      <span className="text-small font-semibold text-text-muted">{label}</span>
      <Select
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </label>
  );
}

export interface FilterDropdownRowProps {
  children: ReactNode;
  className?: string;
}

export function FilterDropdownRow({ children, className }: FilterDropdownRowProps) {
  return (
    <div
      className={cn(
        'grid gap-wilms-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
