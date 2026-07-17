'use client';

import { CurrencyAmount, DataTable } from '@/components/data-display';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { SettingsSectionCard } from '@/features/settings/components/SettingsSectionCard';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import type { ExpenseRecord } from '@/types/expense';
import { SettingsExpensesIcon } from '@/features/settings/components/SettingsSectionIcons';
import { resolveExpenseDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';

export function SettingsExpensesSection() {
  const { data, isLoading } = useExpenses();

  if (isLoading || !data) {
    return <InlinePanelSkeleton />;
  }

  return (
    <div className="space-y-wilms-4">
      <div className="grid gap-wilms-3 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Total expenses</p>
          <p className="text-heading-3 font-bold text-text-primary">{data.expenses.length}</p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Recorded amount</p>
          <p className="text-heading-3 font-bold text-status-active">
            <CurrencyAmount value={data.summary.approvedTotalPesewas} />
          </p>
        </div>
        <div className="rounded-sm border border-border bg-card p-wilms-4">
          <p className="text-small text-text-muted">Pending legacy items</p>
          <p className="text-heading-3 font-bold text-text-primary">{data.summary.pendingCount}</p>
        </div>
      </div>

      <SettingsSectionCard
        title="Expense Records"
        description="Field expenses are recorded automatically and deducted from operational balances — no approval required."
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
              id: 'status',
              header: 'Status',
              className: 'whitespace-nowrap align-middle',
              cell: (row) => row.status,
            },
          ]}
        />
      </SettingsSectionCard>
    </div>
  );
}
