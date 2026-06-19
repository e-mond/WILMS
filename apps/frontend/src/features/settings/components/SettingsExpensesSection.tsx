'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CurrencyAmount, DataTable } from '@/components/data-display';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { PERMISSION } from '@/constants/permissions';
import { Button } from '@/components/ui/Button';
import { expenseService } from '@/services';
import { EXPENSE_STATUS, type ExpenseRecord } from '@/types/expense';
import { useToast } from '@/hooks/useToast';

export function SettingsExpensesSection() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data, isLoading } = useExpenses();

  const reviewExpense = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: typeof EXPENSE_STATUS.APPROVED | typeof EXPENSE_STATUS.REJECTED;
    }) => expenseService.reviewExpense(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated');
    },
  });

  if (isLoading || !data) {
    return <LoadingSpinner label="Loading expenses" className="py-wilms-6" />;
  }

  return (
    <div className="space-y-wilms-4">
      <div className="grid gap-wilms-3 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Pending approvals</p>
          <p className="text-heading-3 font-bold text-text-primary">{data.summary.pendingCount}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Pending amount</p>
          <p className="text-heading-3 font-bold text-danger">
            <CurrencyAmount value={data.summary.pendingTotalPesewas} />
          </p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Approved total</p>
          <p className="text-heading-3 font-bold text-status-active">
            <CurrencyAmount value={data.summary.approvedTotalPesewas} />
          </p>
        </div>
      </div>

      <SettingsSectionCard
        title="Expense Records"
        description="Fuel, transport, airtime, field operations, and office expenses with approval workflow."
        icon={<span aria-hidden="true">🧾</span>}
      >
        <DataTable<ExpenseRecord>
          caption="Expense records"
          data={data.expenses}
          getRowId={(row) => row.id}
          columns={[
            { id: 'id', header: 'Expense ID', cell: (row) => row.id },
            { id: 'category', header: 'Category', cell: (row) => row.categoryLabel },
            {
              id: 'amount',
              header: 'Amount',
              cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
            },
            { id: 'date', header: 'Date', cell: (row) => row.expenseDate },
            { id: 'reason', header: 'Reason', cell: (row) => row.reason },
            { id: 'recordedBy', header: 'Recorded by', cell: (row) => row.recordedByName },
            { id: 'status', header: 'Status', cell: (row) => row.status },
            {
              id: 'actions',
              header: 'Actions',
              cell: (row) =>
                row.status === EXPENSE_STATUS.PENDING ? (
                  <div className="flex flex-wrap gap-wilms-2">
                  <PermissionGate permission={PERMISSION.MANAGE_EXPENSES}>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() =>
                        reviewExpense.mutate({ id: row.id, status: EXPENSE_STATUS.APPROVED })
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        reviewExpense.mutate({ id: row.id, status: EXPENSE_STATUS.REJECTED })
                      }
                    >
                      Reject
                    </Button>
                  </PermissionGate>
                  </div>
                ) : (
                  '—'
                ),
            },
          ]}
        />
      </SettingsSectionCard>
    </div>
  );
}
