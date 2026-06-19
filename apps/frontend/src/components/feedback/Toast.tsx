'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { TOAST_VARIANT, type ToastItem } from '@/types/toast';
import { cn } from '@/utils/cn';

const variantClasses = {
  [TOAST_VARIANT.SUCCESS]: 'border-success bg-success-light text-text-primary',
  [TOAST_VARIANT.ERROR]: 'border-danger bg-danger-light text-text-primary',
  [TOAST_VARIANT.WARNING]: 'border-warning bg-warning-light text-text-primary',
  [TOAST_VARIANT.INFO]: 'border-brand-primary bg-brand-primary-light text-text-primary',
  [TOAST_VARIANT.OFFLINE]: 'border-warning bg-warning-light text-text-primary',
  [TOAST_VARIANT.SYNC]: 'border-brand-primary bg-brand-primary-light text-text-primary',
} as const;

export interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const isError = toast.variant === TOAST_VARIANT.ERROR;
  const durationMs = toast.durationMs ?? 0;

  useEffect(() => {
    if (durationMs <= 0) {
      return;
    }

    const timerId = window.setTimeout(() => {
      onDismiss(toast.id);
    }, durationMs);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [durationMs, onDismiss, toast.id]);

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn(
        'flex w-full items-start justify-between gap-wilms-3 rounded-sm border p-wilms-4',
        variantClasses[toast.variant],
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-heading-3 font-semibold">{toast.title}</p>
        {toast.message ? <p className="mt-wilms-1 text-body">{toast.message}</p> : null}
      </div>
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Dismiss ${toast.title} notification`}
        onClick={() => onDismiss(toast.id)}
        className="shrink-0"
      >
        Dismiss
      </Button>
    </div>
  );
}
