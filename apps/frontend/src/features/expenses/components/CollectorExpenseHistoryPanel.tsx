'use client';

import { useMemo, useState } from 'react';
import { CurrencyAmount, DataTable } from '@/components/data-display';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import type { ExpenseRecord } from '@/types/expense';
import { resolveExpenseDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';

export function CollectorExpenseHistoryPanel() {
  const { user } = useAuth();
  const { data, isLoading } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const myExpenses = useMemo(() => {
    const items = data?.expenses ?? [];
    return items.filter((entry) => entry.recordedById === user?.id);
  }, [data?.expenses, user?.id]);

  const categories = useMemo(
    () => Array.from(new Set(myExpenses.map((entry) => entry.category))).sort(),
    [myExpenses],
  );

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return myExpenses.filter((entry) => {
      if (categoryFilter && entry.category !== categoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const displayId = resolveExpenseDisplayId(entry).toLowerCase();
      return (
        displayId.includes(query) ||
        entry.reason.toLowerCase().includes(query) ||
        entry.categoryLabel.toLowerCase().includes(query)
      );
    });
  }, [categoryFilter, myExpenses, searchQuery]);

  const csvRows = filtered.map((entry, index) => [
    resolveExpenseDisplayId(entry, index + 1),
    entry.categoryLabel,
    formatPesewasForCsv(entry.amountPesewas),
    entry.expenseDate,
    entry.reason,
    entry.status,
  ]);

  if (isLoading) {
    return <p className="text-body text-text-muted">Loading expense history…</p>;
  }

  return (
    <section className="space-y-wilms-4" aria-labelledby="collector-expense-history-heading">
      <div className="flex flex-col gap-wilms-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="collector-expense-history-heading" className="text-heading-2 font-semibold text-text-primary">
            Expense History
          </h2>
          <p className="text-small text-text-muted">Search, filter, export, and print your recorded expenses.</p>
        </div>
        <ExportCsvButton
          label="Export"
          filename="collector-expenses.csv"
          reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
          reportTitle="Collector Expense History"
          headers={['Expense ID', 'Category', 'Amount', 'Date', 'Reason', 'Status']}
          rows={csvRows}
        />
      </div>

      <div className="flex flex-col gap-wilms-3 sm:flex-row">
        <Input
          aria-label="Search expenses"
          placeholder="Search by ID, category, or reason"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="sm:max-w-md"
        />
        <Select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="h-10 min-w-[12rem] rounded-sm border border-border bg-card px-wilms-3 text-small"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </div>

      <DataTable<ExpenseRecord>
        variant="executive"
        layout="auto"
        caption="Collector expense history"
        data={filtered}
        emptyMessage="No expenses recorded yet."
        getRowId={(row) => row.id}
        columns={[
          {
            id: 'id',
            header: 'Expense ID',
            className: 'whitespace-nowrap font-mono text-small tabular-nums',
            cell: (row) => resolveExpenseDisplayId(row),
          },
          {
            id: 'category',
            header: 'Category',
            className: 'whitespace-nowrap',
            cell: (row) => row.categoryLabel,
          },
          {
            id: 'amount',
            header: 'Amount',
            className: 'whitespace-nowrap tabular-nums',
            cell: (row) => <CurrencyAmount value={row.amountPesewas} />,
          },
          {
            id: 'date',
            header: 'Date',
            className: 'whitespace-nowrap tabular-nums',
            cell: (row) => formatDisplayDate(row.expenseDate),
          },
          {
            id: 'reason',
            header: 'Reason',
            cell: (row) => row.reason,
          },
        ]}
      />
    </section>
  );
}
