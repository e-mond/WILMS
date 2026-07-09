import { cn } from '@/utils/cn';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingPayments: number;
  pendingExpenses: number;
  reviewPayments: number;
  isSyncing: boolean;
  hasQueueWarning: boolean;
  className?: string;
}

function formatPendingLabel(pendingPayments: number, pendingExpenses: number): string {
  const parts: string[] = [];

  if (pendingPayments > 0) {
    parts.push(`${pendingPayments} payment${pendingPayments === 1 ? '' : 's'}`);
  }

  if (pendingExpenses > 0) {
    parts.push(`${pendingExpenses} expense${pendingExpenses === 1 ? '' : 's'}`);
  }

  return parts.join(' and ');
}

function getBannerMessage({
  isOffline,
  pendingPayments,
  pendingExpenses,
  reviewPayments,
  isSyncing,
  hasQueueWarning,
}: Omit<OfflineBannerProps, 'className'>): string {
  const pendingCount = pendingPayments + pendingExpenses;
  const pendingLabel = formatPendingLabel(pendingPayments, pendingExpenses);

  if (hasQueueWarning) {
    return `Sync backlog critical: ${pendingCount} saved items waiting. Contact your supervisor.`;
  }

  if (isSyncing && pendingCount > 0) {
    return `Syncing ${pendingLabel}...`;
  }

  if (isOffline) {
    return 'You are offline. Payments and expenses will be saved and synced when connection returns.';
  }

  if (pendingCount > 0) {
    return `${pendingLabel} pending sync.`;
  }

  if (reviewPayments > 0) {
    return `${reviewPayments} payment${reviewPayments === 1 ? '' : 's'} awaiting approver review.`;
  }

  return '';
}

export function OfflineBanner(props: OfflineBannerProps) {
  const { className, ...status } = props;
  const message = getBannerMessage(status);

  if (!message) {
    return null;
  }

  const pendingCount = status.pendingPayments + status.pendingExpenses;
  const isCritical = status.hasQueueWarning;
  const isReviewOnly =
    !status.isOffline && pendingCount === 0 && status.reviewPayments > 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'border-b px-wilms-4 py-wilms-2 text-small font-semibold',
        isCritical
          ? 'border-danger bg-danger-light text-text-primary'
          : isReviewOnly
            ? 'border-status-info bg-status-info-light text-text-primary'
            : 'border-warning bg-warning-light text-text-primary',
        className,
      )}
    >
      {message}
    </div>
  );
}
