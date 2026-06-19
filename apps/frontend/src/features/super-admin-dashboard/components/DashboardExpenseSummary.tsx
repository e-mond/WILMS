'use client';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { ExecutiveKpiGrid } from '@/components/layout/executive';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import { expenseService } from '@/services';

export interface DashboardExpenseSummaryProps {
  compact?: boolean;
}

export function DashboardExpenseSummary({ compact = false }: DashboardExpenseSummaryProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-expense-summary'],
    queryFn: () => expenseService.getExpenseSummary(),
  });

  if (isLoading) {
    return <LoadingSpinner label="Loading expense summary" className="py-wilms-4" />;
  }

  if (isError || !data) {
    return null;
  }

  const periods = [
    { label: 'Today', value: data.todayPesewas },
    { label: 'This Week', value: data.weekPesewas },
    { label: 'This Month', value: data.monthPesewas },
    { label: 'This Year', value: data.yearPesewas },
  ];

  return (
    <section className="space-y-wilms-3">
      <h2 className="text-heading-2 font-semibold text-text-primary">Expense Summary</h2>
      <ExecutiveKpiGrid
        className={
          compact
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'sm:grid-cols-2 xl:grid-cols-4'
        }
      >
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
