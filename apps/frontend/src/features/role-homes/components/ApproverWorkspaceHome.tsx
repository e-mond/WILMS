'use client';

import { RoleWorkspaceHero } from '@/components/layout/RoleWorkspaceHero';
import {
  selectPendingExpenseCount,
  selectPendingHolidayCount,
  selectPendingPaymentCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

export function ApproverWorkspaceHome() {
  const items = useOfflineQueueStore((state) => state.items);
  const pendingPayments = selectPendingPaymentCount(items);
  const pendingExpenses = selectPendingExpenseCount(items);
  const pendingHolidays = selectPendingHolidayCount(items);
  const reviewPayments = selectQueuedForReviewPaymentCount(items);
  const pendingTotal = pendingPayments + pendingExpenses + pendingHolidays;

  return (
    <RoleWorkspaceHero
      title="Approval workspace"
      subtitle="Clear pending applications, holiday requests, and offline sync conflicts with maker-checker intact."
      metrics={[
        {
          label: 'Pending queue',
          value: 'Applications',
          href: '/approver/pending',
        },
        {
          label: 'Offline backlog',
          value: pendingTotal,
          tone: pendingTotal > 0 ? 'warning' : 'success',
          href: '/approver/sync-conflicts',
        },
        {
          label: 'Awaiting review',
          value: reviewPayments,
          tone: reviewPayments > 0 ? 'warning' : 'default',
          href: '/approver/sync-conflicts',
        },
        {
          label: 'Holidays',
          value: 'Review',
          href: '/approver/holidays',
        },
      ]}
      actions={[
        {
          href: '/approver/pending',
          label: 'Open pending queue',
          description: 'Approve or return borrower applications',
        },
        {
          href: '/approver/sync-conflicts',
          label: 'Resolve offline sync',
          description: 'Review conflicts and queued field captures',
        },
        {
          href: '/approver/holidays',
          label: 'Holiday approvals',
          description: 'Maker-checker holiday request decisions',
        },
      ]}
    />
  );
}
