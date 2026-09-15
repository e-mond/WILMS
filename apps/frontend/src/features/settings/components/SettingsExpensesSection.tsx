'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Wallet } from 'lucide-react';
import { CurrencyAmount, DataTable, KpiCard } from '@/components/data-display';
import { InlinePanelSkeleton } from '@/components/feedback/PageSkeletons';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useExpenses } from '@/features/expenses/hooks/useExpenses';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { expenseService } from '@/services';
import type { ExpenseRecord } from '@/types/expense';
import { EXPENSE_STATUS } from '@/types/expense';
import { resolveExpenseDisplayId } from '@/utils/entity-display-id';
import { formatDisplayDate } from '@/utils/format-date';
import { formatPesewasForCsv } from '@/utils/export-csv';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

export function SettingsExpensesSection() {
  const { data, isLoading } = useExpenses();
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const expenseExportRows = useMemo(
    () =>
      (data?.expenses ?? []).map((row) => [
        resolveExpenseDisplayId(row),
        row.categoryLabel,
        formatPesewasForCsv(row.amountPesewas),
        row.expenseDate,
        row.status,
        row.reason ?? '',
      ]),
    [data?.expenses],
  );

  const reviewMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: typeof EXPENSE_STATUS.APPROVED | typeof EXPENSE_STATUS.REJECTED;
      reviewNote?: string;
    }) =>
      expenseService.reviewExpense(input.id, {
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
    <div className="space-y-wilms-5">
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="bg-gradient-to-br from-brand-primary/[0.08] via-transparent to-amber-500/[0.05] px-wilms-5 py-wilms-5 sm:px-wilms-6">
          <div className="flex flex-col gap-wilms-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">
                Financial management
              </p>
              <h1 className="mt-wilms-1 text-heading-1 font-semibold text-text-primary">
                Expense Management
              </h1>
              <p className="mt-wilms-1 max-w-2xl text-small text-text-muted">
                Review field and office spend. Approvals reduce operating cash only — never loan
                principal or pool capital.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-small text-text-muted">
              <Wallet className="h-4 w-4 text-brand-primary" aria-hidden="true" />
              Maker-checker review
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-wilms-3">
        <ExecutiveKpiGrid className="min-w-0 flex-1 sm:grid-cols-3">
          <KpiCard variant="executive" label="Pending review" value={data.summary.pendingCount} />
          <KpiCard
            variant="executive"
            label="Approved amount"
            value={<CurrencyAmount value={data.summary.approvedTotalPesewas} />}
            valueClassName="text-status-active"
          />
          <KpiCard
            variant="executive"
            label="Pending amount"
            value={<CurrencyAmount value={data.summary.pendingTotalPesewas} />}
          />
        </ExecutiveKpiGrid>
        <ExportCsvButton
          label="Export expenses"
          filename={`WILMS_Expense_Report_${new Date().toISOString().slice(0, 10)}.csv`}
          reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
          reportTitle="Expense Report"
          executiveSummary={`Pending ${data.summary.pendingCount}; approved total ${formatPesewasForCsv(data.summary.approvedTotalPesewas)} GHS.`}
          headers={['Expense ID', 'Category', 'Amount (GHS)', 'Date', 'Status', 'Reason']}
          rows={expenseExportRows}
        />
      </div>

      <section className="overflow-hidden rounded-2xl border border-border/80 bg-card">
        <div className="flex items-start gap-wilms-3 border-b border-border/70 px-wilms-5 py-wilms-4">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-brand-primary/20 bg-brand-primary/10 text-brand-primary">
            <Receipt className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-heading-3 font-semibold text-text-primary">Expense records</h2>
            <p className="text-small text-text-muted">
              Submitted expenses need a different reviewer before they affect operating cash.
            </p>
          </div>
        </div>
        <div className="p-wilms-3 sm:p-wilms-4">
          <DataTable<ExpenseRecord>
            mobileLayout="stack"
            variant="executive"
            layout="auto"
            caption="Expense records"
            data={data.expenses}
            getRowId={(row) => row.id}
            columns={[
              {
                id: 'id',
                priority: 'primary',
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
                cell: (row) => (
                  <Badge
                    variant={
                      row.status === EXPENSE_STATUS.APPROVED
                        ? 'success'
                        : row.status === EXPENSE_STATUS.REJECTED
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
              {
                id: 'reason',
                header: 'Reason',
                className: 'min-w-[12rem] max-w-[20rem] align-middle',
                cell: (row) => (
                  <span className="line-clamp-2 text-small leading-relaxed">{row.reason}</span>
                ),
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
        </div>
      </section>
    </div>
  );
}
