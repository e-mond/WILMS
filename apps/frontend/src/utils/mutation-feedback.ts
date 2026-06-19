import { useUiStore } from '@/state/uiStore';
import { ApiError } from '@/types/api';
import { TOAST_VARIANT } from '@/types/toast';

export function resolveMutationErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function notifyMutationSuccess(title: string, message?: string): void {
  useUiStore.getState().addToast({
    variant: TOAST_VARIANT.SUCCESS,
    title,
    message,
  });
}

export function notifyMutationError(title: string, error: unknown, fallback: string): void {
  useUiStore.getState().addToast({
    variant: TOAST_VARIANT.ERROR,
    title,
    message: resolveMutationErrorMessage(error, fallback),
  });
}

export function notifyMutationWarning(title: string, message?: string): void {
  useUiStore.getState().addToast({
    variant: TOAST_VARIANT.WARNING,
    title,
    message,
  });
}

export function notifyMutationInfo(title: string, message?: string): void {
  useUiStore.getState().addToast({
    variant: TOAST_VARIANT.INFO,
    title,
    message,
  });
}
