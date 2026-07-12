'use client';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { expenseService } from '@/services';
import {
  CurrencyStatValue,
  DashboardFinancialStat,
  DashboardFinancialStatGrid,
} from '@/features/super-admin-dashboard/components/DashboardFinancialStat';

export interface DashboardExpenseSummaryProps {
  compact?: boolean;
}

export function DashboardExpenseSummary({ compact = false }: DashboardExpenseSummaryProps) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard-expense-summary'],
    queryFn: () => expenseService.getExpenseSummary(),
  });
  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({ isLoading, isError, error });

  if (isTimedOut && isLoading) {
    return (
      <QueryStatePanel
        isLoading
        isTimedOut
        isError={false}
        isForbidden={isForbidden}
        onRetry={() => void refetch()}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (showLoading && isLoading) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  if (isError) {
    return (
      <QueryStatePanel
        isLoading={false}
        isError
        error={error}
        onRetry={() => void refetch()}
        variant="inline"
      >
        {null}
      </QueryStatePanel>
    );
  }

  if (!data) {
    return (
      <QueryStatePanel isLoading showLoading isError={false} variant="inline">
        {null}
      </QueryStatePanel>
    );
  }

  const periods = [
    { label: 'Today', value: data.todayPesewas },
    { label: 'This Week', value: data.weekPesewas },
    { label: 'This Month', value: data.monthPesewas },
    { label: 'This Year', value: data.yearPesewas },
  ];

  if (compact) {
    return (
      <section className="space-y-wilms-4">
        <div>
          <h3 className="text-heading-3 font-semibold text-text-primary">Expense Summary</h3>
          <p className="mt-wilms-1 text-small text-text-muted">Approved field and office spend by period</p>
        </div>
        <DashboardFinancialStatGrid>
          {periods.map((period) => (
            <DashboardFinancialStat
              key={period.label}
              label={period.label}
              value={<CurrencyStatValue pesewas={period.value} />}
            />
          ))}
        </DashboardFinancialStatGrid>
      </section>
    );
  }

  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-2 font-semibold text-text-primary">Expense Summary</h2>
      <ExecutiveKpiGrid className="sm:grid-cols-2 xl:grid-cols-4">
        {periods.map((period) => (
          <KpiCard
            key={period.label}
            variant="executive"
            label={period.label}
            value={<CurrencyAmount value={period.value} />}
          />
        ))}
      </ExecutiveKpiGrid>
    </section>
  );
}
