'use client';

import { useEffect, useState } from 'react';

export interface StorageEstimateSnapshot {
  supported: boolean;
  usageBytes: number | null;
  quotaBytes: number | null;
  usageLabel: string;
  quotaLabel: string;
  percentUsed: number | null;
  critical: boolean;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function estimateLocalStorageBytes(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  let total = 0;
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }
    const value = window.localStorage.getItem(key) ?? '';
    total += key.length + value.length;
  }

  return total * 2;
}

export function useStorageEstimate(): StorageEstimateSnapshot {
  const [snapshot, setSnapshot] = useState<StorageEstimateSnapshot>({
    supported: false,
    usageBytes: null,
    quotaBytes: null,
    usageLabel: '—',
    quotaLabel: '—',
    percentUsed: null,
    critical: false,
  });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const localBytes = estimateLocalStorageBytes();
      let usage = localBytes;
      let quota: number | null = null;
      let supported = false;

      if (navigator.storage?.estimate) {
        try {
          const estimate = await navigator.storage.estimate();
          supported = true;
          usage = estimate.usage ?? localBytes;
          quota = estimate.quota ?? null;
        } catch {
          supported = false;
        }
      }

      if (cancelled) {
        return;
      }

      const percentUsed = quota ? Math.round((usage / quota) * 100) : null;
      setSnapshot({
        supported,
        usageBytes: usage,
        quotaBytes: quota,
        usageLabel: formatBytes(usage),
        quotaLabel: quota ? formatBytes(quota) : 'Unknown',
        percentUsed,
        critical: percentUsed !== null && percentUsed >= 85,
      });
    }

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return snapshot;
}
