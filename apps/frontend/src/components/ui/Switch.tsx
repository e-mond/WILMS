'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
  loading?: boolean;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, className, disabled, loading = false, id, ...props },
  ref,
) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  const isDisabled = disabled || loading;

  return (
    <div className={cn('inline-flex min-h-[44px] items-center gap-wilms-3', className)}>
      <span
        className={cn(
          'inline-flex rounded-full p-1 transition-colors',
          !checked &&
            'border border-border bg-background shadow-sm ring-1 ring-inset ring-border/70',
        )}
      >
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${switchId}-label`}
          aria-busy={loading || undefined}
          disabled={isDisabled}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-all duration-200',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
            checked ? 'border-brand-primary bg-brand-primary' : 'border-border/80 bg-muted/70',
            isDisabled && 'cursor-not-allowed opacity-50',
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              'pointer-events-none inline-block h-5 w-5 rounded-full bg-card shadow-sm transition-transform duration-200',
              checked ? 'translate-x-[22px]' : 'translate-x-0.5',
              loading && 'opacity-70',
            )}
          />
        </button>
      </span>
      <label
        id={`${switchId}-label`}
        htmlFor={switchId}
        className={cn(
          'cursor-pointer whitespace-nowrap text-body text-text-primary',
          isDisabled && 'cursor-not-allowed opacity-70',
        )}
      >
        {label}
        {loading ? <span className="sr-only"> Updating</span> : null}
      </label>
    </div>
  );
});
