import { cn } from '@/utils/cn';

export interface OfflineBannerProps {
  isOffline: boolean;
  pendingPayments: number;
  pendingExpenses: number;
  pendingHolidays?: number;
  reviewPayments: number;
  isSyncing: boolean;
  hasQueueWarning: boolean;
  onRetrySync?: () => void;
  className?: string;
}

function formatPendingLabel(
  pendingPayments: number,
  pendingExpenses: number,
  pendingHolidays: number,
): string {
  const parts: string[] = [];

  if (pendingPayments > 0) {
    parts.push(`${pendingPayments} payment${pendingPayments === 1 ? '' : 's'}`);
  }

  if (pendingExpenses > 0) {
    parts.push(`${pendingExpenses} expense${pendingExpenses === 1 ? '' : 's'}`);
  }

  if (pendingHolidays > 0) {
    parts.push(`${pendingHolidays} holiday request${pendingHolidays === 1 ? '' : 's'}`);
  }

  return parts.join(', ');
}

function getBannerMessage({
  isOffline,
  pendingPayments,
  pendingExpenses,
  pendingHolidays = 0,
  reviewPayments,
  isSyncing,
  hasQueueWarning,
}: Omit<OfflineBannerProps, 'className' | 'onRetrySync'>): string {
  const pendingCount = pendingPayments + pendingExpenses + pendingHolidays;
  const pendingLabel = formatPendingLabel(pendingPayments, pendingExpenses, pendingHolidays);

  if (hasQueueWarning) {
    return `Sync backlog critical: ${pendingCount} saved items waiting. Contact your supervisor.`;
  }

  if (isOffline) {
    return 'Offline. Working from locally stored data. Changes will sync automatically.';
  }

  if (isSyncing && pendingCount > 0) {
    return `Syncing ${pendingLabel}…`;
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
  const { className, onRetrySync, ...status } = props;
  const message = getBannerMessage(status);

  if (!message) {
    return null;
  }

  const pendingCount =
    status.pendingPayments + status.pendingExpenses + (status.pendingHolidays ?? 0);
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
          ? 'border-danger bg-danger/10 text-danger'
          : isReviewOnly
            ? 'border-status-info bg-status-info-light text-status-info'
            : status.isOffline
              ? 'border-status-at-risk bg-status-at-risk-light text-status-at-risk'
              : 'border-brand-primary bg-brand-primary-light text-brand-primary',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-wilms-2">
        <span>{message}</span>
        {onRetrySync && pendingCount > 0 && !status.isOffline ? (
          <button
            type="button"
            className="underline underline-offset-2"
            onClick={onRetrySync}
          >
            Retry sync
          </button>
        ) : null}
      </div>
    </div>
  );
}
