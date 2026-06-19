'use client';

import { useEffect } from 'react';
import { notifyMutationSuccess } from '@/utils/mutation-feedback';

declare global {
  interface Window {
    __wilmsE2E?: {
      showSuccessToast: (title: string, message?: string) => void;
    };
  }
}

/**
 * Development-only hook for Playwright to verify toast rendering without
 * depending on mutable mock workflow state.
 */
export function E2eBridge() {
  useEffect(() => {
    window.__wilmsE2E = {
      showSuccessToast: notifyMutationSuccess,
    };

    return () => {
      delete window.__wilmsE2E;
    };
  }, []);

  return null;
}
