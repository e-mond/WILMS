export const TOAST_VARIANT = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  OFFLINE: 'offline',
  SYNC: 'sync',
} as const;

export type ToastVariant = (typeof TOAST_VARIANT)[keyof typeof TOAST_VARIANT];

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  message?: string;
  /** Auto-dismiss after ms; 0 = persistent until dismissed. Default 5000. */
  durationMs?: number;
  /** When set, suppresses duplicate toasts with the same key until dismissed. */
  dedupeKey?: string;
}

export interface ToastItem extends ToastInput {
  id: string;
  createdAt: number;
  dedupeKey?: string;
}
