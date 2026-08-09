'use client';

import { RoleWorkspaceHero } from '@/components/layout/RoleWorkspaceHero';
import { usePendingApplications } from '@/features/approval-workflow/hooks/usePendingApplications';
import {
  selectPendingExpenseCount,
  selectPendingHolidayCount,
  selectPendingPaymentCount,
  selectQueuedForReviewPaymentCount,
  useOfflineQueueStore,
} from '@/state/offlineQueueStore';

export function ApproverWorkspaceHome() {
  const { data: pendingApplications } = usePendingApplications();
  const pendingApplicationCount = pendingApplications?.length ?? 0;

  const items = useOfflineQueueStore((state) => state.items);
  const pendingPayments = selectPendingPaymentCount(items);
  const pendingExpenses = selectPendingExpenseCount(items);
  const pendingHolidays = selectPendingHolidayCount(items);
  const reviewPayments = selectQueuedForReviewPaymentCount(items);
  const pendingTotal = pendingPayments + pendingExpenses + pendingHolidays;

  return (
    <RoleWorkspaceHero
      title="Approval workspace"
      subtitle="Pending applications, holiday requests, and offline exceptions."
      metrics={[
        {
          label: 'Pending applications',
          value: pendingApplicationCount,
          tone: pendingApplicationCount > 0 ? 'warning' : 'success',
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
          label: 'Holiday requests',
          value: pendingHolidays > 0 ? pendingHolidays : 'Review',
          tone: pendingHolidays > 0 ? 'warning' : 'default',
          href: '/approver/holidays',
        },
      ]}
    />
  );
}
