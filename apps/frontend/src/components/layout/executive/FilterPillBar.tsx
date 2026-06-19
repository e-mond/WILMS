'use client';

import { cn } from '@/utils/cn';

export interface FilterPillBarProps {
  options: FilterPillOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}

export interface FilterPillOption {
  value: string;
  label: string;
}

export function FilterPillBar({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterPillBarProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'flex max-w-full flex-nowrap gap-wilms-2 overflow-x-auto pb-0.5',
        '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        'lg:overflow-visible lg:pb-0',
        className,
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value || 'all'}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              'min-h-[44px] shrink-0 rounded-sm border px-wilms-3 py-wilms-2 text-small font-semibold transition-colors',
              isActive
                ? 'border-brand-primary bg-brand-primary text-background'
                : 'border-border bg-card text-text-muted hover:border-brand-primary hover:text-text-primary',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
