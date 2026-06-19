'use client';

import { useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Toast } from '@/components/feedback/Toast';
import { useUiStore } from '@/state/uiStore';

export function ToastContainer() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  const handleDismiss = useCallback(
    (id: string) => {
      dismissToast(id);
    },
    [dismissToast],
  );

  if (typeof document === 'undefined' || toasts.length === 0) {
    return null;
  }

  return createPortal(
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-end gap-wilms-2 p-wilms-4 sm:inset-x-auto sm:right-0 sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full">
          <Toast toast={toast} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}
