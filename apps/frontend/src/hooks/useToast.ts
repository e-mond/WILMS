'use client';

import { useCallback, useMemo } from 'react';
import { DEFAULT_TOAST_DURATION_MS } from '@/constants/toast';
import { useUiStore } from '@/state/uiStore';
import { TOAST_VARIANT, type ToastInput, type ToastVariant } from '@/types/toast';

interface ToastOptions {
  message?: string;
  durationMs?: number;
}

function buildToastInput(
  variant: ToastVariant,
  title: string,
  options?: ToastOptions,
): ToastInput {
  return {
    variant,
    title,
    message: options?.message,
    durationMs: options?.durationMs ?? DEFAULT_TOAST_DURATION_MS,
  };
}

export function useToast() {
  const addToast = useUiStore((state) => state.addToast);
  const dismissToast = useUiStore((state) => state.dismissToast);
  const clearToasts = useUiStore((state) => state.clearToasts);

  const show = useCallback(
    (input: ToastInput) => addToast(input),
    [addToast],
  );

  const success = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(buildToastInput(TOAST_VARIANT.SUCCESS, title, options)),
    [addToast],
  );

  const error = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(buildToastInput(TOAST_VARIANT.ERROR, title, options)),
    [addToast],
  );

  const warning = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(buildToastInput(TOAST_VARIANT.WARNING, title, options)),
    [addToast],
  );

  const info = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(buildToastInput(TOAST_VARIANT.INFO, title, options)),
    [addToast],
  );

  const offline = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(
        buildToastInput(TOAST_VARIANT.OFFLINE, title, {
          ...options,
          durationMs: options?.durationMs ?? 0,
        }),
      ),
    [addToast],
  );

  const sync = useCallback(
    (title: string, options?: ToastOptions) =>
      addToast(buildToastInput(TOAST_VARIANT.SYNC, title, options)),
    [addToast],
  );

  return useMemo(
    () => ({
      show,
      success,
      error,
      warning,
      info,
      offline,
      sync,
      dismiss: dismissToast,
      clear: clearToasts,
    }),
    [show, success, error, warning, info, offline, sync, dismissToast, clearToasts],
  );
}
