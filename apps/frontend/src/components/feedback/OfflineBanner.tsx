import { cn } from '@/utils/cn';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  hasQueueWarning: boolean;
  className?: string;
}

function getBannerMessage({
  isOffline,
  pendingCount,
  isSyncing,
  hasQueueWarning,
}: Omit<OfflineBannerProps, 'className'>): string {
  if (hasQueueWarning) {
    return `Sync backlog critical: ${pendingCount} payments waiting. Contact your supervisor.`;
  }

  if (isSyncing) {
    return `Syncing ${pendingCount} saved payment${pendingCount === 1 ? '' : 's'}...`;
  }

  if (isOffline) {
    return 'You are offline. Payments will be saved and synced when connection returns.';
  }

  if (pendingCount > 0) {
    return `${pendingCount} payment${pendingCount === 1 ? '' : 's'} pending sync.`;
  }

  return '';
}

export function OfflineBanner(props: OfflineBannerProps) {
  const { className, ...status } = props;
  const message = getBannerMessage(status);

  if (!message) {
    return null;
  }

  const isCritical = status.hasQueueWarning;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-b px-wilms-4 py-wilms-2 text-small font-semibold',
        isCritical
          ? 'border-danger bg-danger-light text-text-primary'
          : 'border-warning bg-warning-light text-text-primary',
        className,
      )}
    >
      {message}
    </div>
  );
}
