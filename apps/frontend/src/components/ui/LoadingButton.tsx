'use client';

import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingLabel?: string;
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  function LoadingButton(
    { loading = false, loadingLabel, disabled, children, className, ...props },
    ref,
  ) {
    const label = loadingLabel ?? children;

    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn('relative', className)}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-wilms-2">
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            <span>{label}</span>
          </span>
        ) : (
          children
        )}
      </Button>
    );
  },
);
