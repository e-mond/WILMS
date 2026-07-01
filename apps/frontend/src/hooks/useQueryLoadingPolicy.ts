'use client';

import { useEffect, useState } from 'react';
import {
  LOADING_DEBOUNCE_MS,
  LOADING_TIMEOUT_MS,
} from '@/constants/loading-policy';
import { ApiError } from '@/types/api';

export interface QueryLoadingPolicyInput {
  isLoading: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: unknown;
}

export interface QueryLoadingPolicyResult {
  /** True after debounce while the query is still in flight. */
  showLoading: boolean;
  /** True after the timeout threshold while still loading. */
  isTimedOut: boolean;
  /** True when the query failed with HTTP 403. */
  isForbidden: boolean;
  /** Combined in-flight state. */
  isPending: boolean;
}

export function useQueryLoadingPolicy({
  isLoading,
  isFetching = false,
  isError = false,
  error,
}: QueryLoadingPolicyInput): QueryLoadingPolicyResult {
  const isPending = isLoading || isFetching;
  const [showLoading, setShowLoading] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const isForbidden =
    isError && error instanceof ApiError && error.status === 403;

  useEffect(() => {
    if (!isPending) {
      setShowLoading(false);
      setIsTimedOut(false);
      return;
    }

    const debounceTimer = window.setTimeout(() => {
      setShowLoading(true);
    }, LOADING_DEBOUNCE_MS);

    const timeoutTimer = window.setTimeout(() => {
      setIsTimedOut(true);
    }, LOADING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(debounceTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [isPending]);

  return {
    showLoading: isPending && showLoading,
    isTimedOut: isPending && isTimedOut,
    isForbidden,
    isPending,
  };
}
