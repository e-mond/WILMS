'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CurrencyAmount, DataTable } from '@/components/data-display';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { Button } from '@/components/ui/Button';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { expenseService } from '@/services';
import type { ExpenseRecord } from '@/types/expense';
import { EXPENSE_STATUS } from '@/types/expense';
import { SettingsExpensesIcon } from '@/features/settings/components/SettingsSectionIcons';
import { resolveExpenseDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export function SettingsExpensesSection() {
  const { data, isLoading } = useExpenses();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const reviewMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: typeof EXPENSE_STATUS.APPROVED | typeof EXPENSE_STATUS.REJECTED;
      reviewNote?: string;
    }) => expenseService.reviewExpense(input.id, {
      status: input.status,
      reviewNote: input.reviewNote,
    }),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(
        variables.status === EXPENSE_STATUS.APPROVED
          ? 'Expense approved.'
          : 'Expense rejected.',
      );
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Unable to review this expense right now.';
      toast.error(message);
    },
    onSettled: () => setBusyId(null),
  });

  if (isLoading || !data) {
    return <InlinePanelSkeleton />;
  }

  return (
    <div className="space-y-wilms-4">
      <div className="grid gap-wilms-3 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Pending review</p>
          <p className="text-heading-3 font-bold text-text-primary">{data.summary.pendingCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Approved amount</p>
          <p className="text-heading-3 font-bold text-status-active">
            <CurrencyAmount value={data.summary.approvedTotalPesewas} />
          </p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Pending amount</p>
          <p className="text-heading-3 font-bold text-text-primary">
            <CurrencyAmount value={data.summary.pendingTotalPesewas} />
          </p>
        </div>
      </div>

      <SettingsSectionCard
        title="Expense Records"
        description="Submitted expenses require a different reviewer before they affect operating cash. Approvals never change loan principal or pool capital."
        icon={<SettingsExpensesIcon />}
      >
        <DataTable<ExpenseRecord>
          variant="executive"
          layout="auto"
          caption="Expense records"
          data={data.expenses}
          getRowId={(row) => row.id}
          columns={[
            {
              id: 'id',
              header: 'Expense ID',
              className: 'whitespace-nowrap align-middle font-mono text-small tabular-nums',
              cell: (row) => resolveExpenseDisplayId(row),
            },
            {
              id: 'category',
              header: 'Category',
              className: 'whitespace-nowrap align-middle min-w-[8rem]',
              cell: (row) => row.categoryLabel,
            },
            {
              id: 'amount',
              header: 'Amount',
              className: 'whitespace-nowrap align-middle tabular-nums',
              cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
            },
            {
              id: 'date',
              header: 'Date',
              className: 'whitespace-nowrap align-middle tabular-nums',
              cell: (row) => formatDisplayDate(row.expenseDate),
            },
            {
              id: 'status',
              header: 'Status',
              className: 'whitespace-nowrap align-middle',
              cell: (row) => row.status,
            },
            {
              id: 'reason',
              header: 'Reason',
              className: 'min-w-[12rem] max-w-[20rem] align-middle',
              cell: (row) => <span className="line-clamp-2 text-small leading-relaxed">{row.reason}</span>,
            },
            {
              id: 'recordedBy',
              header: 'Recorded by',
              className: 'whitespace-nowrap align-middle min-w-[9rem]',
              cell: (row) => row.recordedByName,
            },
            {
              id: 'actions',
              header: 'Actions',
              className: 'whitespace-nowrap align-middle',
              cell: (row) => {
                if (row.status !== EXPENSE_STATUS.PENDING) {
                  return <span className="text-small text-text-muted">—</span>;
                }
                if (row.recordedById === user?.id) {
                  return (
                    <span className="text-small text-text-muted">Awaiting another reviewer</span>
                  );
                }
                const busy = busyId === row.id || reviewMutation.isPending;
                return (
                  <div className="flex gap-wilms-2">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={busy}
                      onClick={() => {
                        setBusyId(row.id);
                        reviewMutation.mutate({ id: row.id, status: EXPENSE_STATUS.APPROVED });
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      disabled={busy}
                      onClick={() => {
                        const reason = window.prompt('Rejection reason');
                        if (!reason?.trim()) {
                          return;
                        }
                        setBusyId(row.id);
                        reviewMutation.mutate({
                          id: row.id,
                          status: EXPENSE_STATUS.REJECTED,
                          reviewNote: reason.trim(),
                        });
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </SettingsSectionCard>
    </div>
  );
}
