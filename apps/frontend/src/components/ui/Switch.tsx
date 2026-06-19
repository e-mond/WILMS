'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onChange, label, className, disabled, id, ...props },
  ref,
) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('inline-flex items-center gap-wilms-2', className)}>
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-6 w-11 rounded-sm border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
          checked ? 'border-brand-primary bg-brand-primary' : 'border-border bg-card',
          disabled && 'cursor-not-allowed opacity-50',
        )}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-sm bg-card transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
      <label htmlFor={switchId} className="text-body text-text-primary">
        {label}
      </label>
    </div>
  );
});
