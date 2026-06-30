'use client';

import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { cn } from '@/utils/cn';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export interface ConnectionStatusChipProps {
  compact?: boolean;
}

export function ConnectionStatusChip({ compact = false }: ConnectionStatusChipProps) {
  const { isOnline } = useOfflineStatus();
  const { status, label } = useSystemStatus();

  const StatusIcon =
    status === 'offline' ? WifiOff : status === 'degraded' ? AlertTriangle : Wifi;

  const toneClass =
    status === 'healthy'
      ? compact
        ? 'text-status-active'
        : 'border-status-active bg-status-active-light text-status-active'
      : status === 'degraded'
        ? compact
          ? 'text-warning'
          : 'border-warning bg-warning-light text-warning'
        : compact
          ? 'text-text-muted'
          : 'border-border bg-muted text-text-muted';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-sm border font-semibold',
        compact
          ? 'h-11 w-11 min-h-[44px] min-w-[44px] justify-center border-transparent bg-transparent p-0'
          : 'gap-wilms-2 px-wilms-2 py-wilms-1 text-small',
        isOnline ? toneClass : compact ? 'text-text-muted' : 'border-border bg-muted text-text-muted',
      )}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <StatusIcon className={cn('shrink-0', compact ? 'h-5 w-5' : 'h-4 w-4')} aria-hidden="true" />
      {!compact ? <span className="whitespace-nowrap">{label}</span> : null}
    </span>
  );
}
