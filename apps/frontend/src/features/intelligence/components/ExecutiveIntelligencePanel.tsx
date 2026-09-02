'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Banknote,
  BellRing,
  Briefcase,
  CircleAlert,
  CircleCheck,
  FileX2,
  HandCoins,
  Percent,
  PieChart,
  Send,
  Timer,
  TrendingUp,
  UserRound,
  Users,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { CurrencyAmount, KpiCard } from '@/components/data-display';
import { QueryStatePanel } from '@/components/feedback/QueryStatePanel';
import { ExecutiveKpiGrid, ManagementToolbar } from '@/components/layout/executive';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ExportCsvButton } from '@/features/reports/components/ExportCsvButton';
import { WILMS_REPORT_TYPE } from '@/features/export';
import { useQueryLoadingPolicy } from '@/hooks/useQueryLoadingPolicy';
import { intelligenceService } from '@/services/intelligenceService';
import type { ExecutiveDashboard } from '@/types/intelligence';
import { formatPesewasForCsv } from '@/utils/export-csv';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ExecutiveIntelligencePanel() {
  const [communityDraft, setCommunityDraft] = useState('');
  const [community, setCommunity] = useState('');
  const [asOf, setAsOf] = useState(todayIso);

  const dashboardQuery = useQuery({
    queryKey: ['intelligence', 'executive-dashboard', community, asOf] as const,
    queryFn: () =>
      intelligenceService.getExecutiveDashboard({
        community: community || undefined,
        asOf: asOf || undefined,
      }),
  });

  const { showLoading, isTimedOut, isForbidden } = useQueryLoadingPolicy({
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
  });

  const applyFilters = () => {
    setCommunity(communityDraft.trim());
  };

  return (
    <div className="space-y-wilms-6 print:space-y-4" data-testid="executive-intelligence">
      <div className="flex flex-wrap items-end justify-between gap-wilms-3 border-b border-border pb-wilms-4 print:border-0">
        <div>
          <p className="text-small font-semibold uppercase tracking-[0.12em] text-brand-primary">
            Executive intelligence
          </p>
          <h1 className="mt-wilms-2 text-heading-1 font-semibold tracking-tight text-text-primary md:text-[2.25rem]">
            Portfolio health
          </h1>
          <p className="mt-wilms-3 max-w-2xl text-body text-text-muted">
            Portfolio value, collection performance, and delinquency as of the selected date.{' '}
            <Link href="/dashboard" className="font-semibold text-brand-primary hover:underline">
              Operational dashboard
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-wilms-2 print:hidden">
          <label className="block text-small text-text-muted">
            Community
            <Input
              className="mt-1 w-44"
              value={communityDraft}
              onChange={(event) => setCommunityDraft(event.target.value)}
              placeholder="All communities"
            />
          </label>
          <label className="block text-small text-text-muted">
            As of
            <Input
              type="date"
              className="mt-1 w-40"
              value={asOf}
              onChange={(event) => setAsOf(event.target.value)}
            />
          </label>
          <Button type="button" variant="secondary" onClick={applyFilters}>
            Apply
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void dashboardQuery.refetch()}
            disabled={dashboardQuery.isFetching}
          >
            {dashboardQuery.isFetching ? 'Refreshing…' : 'Refresh'}
          </Button>
        </div>
      </div>

      <QueryStatePanel
        isLoading={dashboardQuery.isLoading}
        showLoading={showLoading}
        isTimedOut={isTimedOut}
        isError={dashboardQuery.isError}
        error={dashboardQuery.error}
        errorMessage="Unable to load executive intelligence."
        isForbidden={isForbidden}
        onRetry={() => void dashboardQuery.refetch()}
        variant="cards"
      >
        {dashboardQuery.data ? (
          <ExecutiveDashboardContent data={dashboardQuery.data} />
        ) : null}
      </QueryStatePanel>
    </div>
  );
}

function ExecutiveDashboardContent({ data }: { data: ExecutiveDashboard }) {
  const financial = data.financial ?? {};
  const operational = data.operational ?? {};
  const risk = data.risk ?? {};

  const csvRows = useMemo(
    () => [
      ['As of', data.asOfDate],
      ['Community', data.filters.community ?? ''],
      ['Total portfolio (GHS)', formatPesewasForCsv(data.financial?.totalPortfolioPesewas ?? 0)],
      ['Outstanding (GHS)', formatPesewasForCsv(data.financial?.outstandingPesewas ?? 0)],
      ['Collected (GHS)', formatPesewasForCsv(data.financial?.collectedPesewas ?? 0)],
      ['Collection rate %', String(data.financial?.collectionRatePercent ?? '')],
      ['Recovery rate %', String(data.financial?.recoveryRatePercent ?? '')],
      ['PAR30 rate %', String(data.risk?.par30RatePercent ?? '')],
      ['Active loans', String(data.operational?.activeLoans ?? '')],
      ['Active borrowers', String(data.operational?.activeBorrowers ?? '')],
    ],
    [data],
  );

  return (
    <div className="space-y-wilms-8 print:space-y-6">
      <ManagementToolbar
        search={
          <p className="text-small text-text-muted">
            Generated {new Date(data.generatedAt).toLocaleString()}
            {data.filters.community ? ` · ${data.filters.community}` : ''}
          </p>
        }
        actions={
          <div className="flex flex-wrap gap-wilms-2 print:hidden">
            <ExportCsvButton
              label="Export board report"
              filename={`WILMS_Executive_Board_Report_${data.asOfDate}.csv`}
              reportType={WILMS_REPORT_TYPE.GENERIC_REPORT}
              reportTitle="Executive Board Report"
              executiveSummary={`Board KPI summary as of ${data.asOfDate}${data.filters.community ? ` for ${data.filters.community}` : ''}.`}
              headers={['Metric', 'Value']}
              rows={csvRows}
            />
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />

      <section
        aria-labelledby="financial-kpi-heading"
        className="space-y-wilms-5 pt-wilms-6"
      >
        <div className="space-y-wilms-2">
          <h2 id="financial-kpi-heading" className="text-heading-2 font-semibold text-text-primary">
            Portfolio & cash
          </h2>
          <p className="text-small text-text-muted">
            Board-level liquidity, recovery, and portfolio position
          </p>
        </div>
        <ExecutiveKpiGrid>
          <KpiCard
            variant="executive"
            label="Portfolio"
            icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
            value={<CurrencyAmount value={financial.totalPortfolioPesewas ?? 0} />}
          />
          <KpiCard
            variant="executive"
            label="Outstanding"
            icon={<CircleAlert className="h-4 w-4" aria-hidden="true" />}
            value={<CurrencyAmount value={financial.outstandingPesewas ?? 0} />}
          />
          <KpiCard
            variant="executive"
            label="Collected"
            icon={<Banknote className="h-4 w-4" aria-hidden="true" />}
            value={<CurrencyAmount value={financial.collectedPesewas ?? 0} />}
          />
          <KpiCard
            variant="executive"
            label="Collection rate"
            icon={<Percent className="h-4 w-4" aria-hidden="true" />}
            value={`${financial.collectionRatePercent ?? 0}%`}
          />
          <KpiCard
            variant="executive"
            label="Operating cash"
            icon={<Wallet className="h-4 w-4" aria-hidden="true" />}
            value={<CurrencyAmount value={financial.liquidityPesewas ?? 0} />}
          />
          <KpiCard
            variant="executive"
            label="Expense ratio"
            icon={<PieChart className="h-4 w-4" aria-hidden="true" />}
            value={`${financial.expenseRatioPercent ?? 0}%`}
          />
          <KpiCard
            variant="executive"
            label="Recovery rate"
            icon={<TrendingUp className="h-4 w-4" aria-hidden="true" />}
            value={`${financial.recoveryRatePercent ?? 0}%`}
          />
          <KpiCard
            variant="executive"
            label="Write-offs"
            icon={<FileX2 className="h-4 w-4" aria-hidden="true" />}
            value={<CurrencyAmount value={financial.writeOffsPesewas ?? 0} />}
          />
        </ExecutiveKpiGrid>
      </section>

      <section
        aria-labelledby="risk-kpi-heading"
        className="space-y-wilms-5 border-t border-border/70 pt-wilms-6"
      >
        <div className="space-y-wilms-2">
          <h2 id="risk-kpi-heading" className="text-heading-2 font-semibold text-text-primary">
            Delinquency & PAR
          </h2>
          <p className="text-small text-text-muted">Portfolio at risk across 30 / 60 / 90 day bands</p>
        </div>
        <ExecutiveKpiGrid>
          <KpiCard
            variant="executive"
            label="PAR30 rate"
            icon={<Timer className="h-4 w-4" aria-hidden="true" />}
            value={`${risk.par30RatePercent ?? 0}%`}
            valueClassName="text-warning"
          />
          <KpiCard
            variant="executive"
            label="PAR60 rate"
            icon={<Timer className="h-4 w-4" aria-hidden="true" />}
            value={`${risk.par60RatePercent ?? 0}%`}
            valueClassName="text-warning"
          />
          <KpiCard
            variant="executive"
            label="PAR90 rate"
            icon={<Timer className="h-4 w-4" aria-hidden="true" />}
            value={`${risk.par90RatePercent ?? 0}%`}
            valueClassName="text-danger"
          />
          <KpiCard
            variant="executive"
            label="PAR30 count"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            value={risk.par30Count ?? 0}
          />
          <KpiCard
            variant="executive"
            label="PAR60 count"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            value={risk.par60Count ?? 0}
          />
          <KpiCard
            variant="executive"
            label="PAR90 count"
            icon={<Users className="h-4 w-4" aria-hidden="true" />}
            value={risk.par90Count ?? 0}
          />
        </ExecutiveKpiGrid>
      </section>

      <section
        aria-labelledby="operational-kpi-heading"
        className="space-y-wilms-5 border-t border-border/70 pt-wilms-6"
      >
        <div className="space-y-wilms-2">
          <h2 id="operational-kpi-heading" className="text-heading-2 font-semibold text-text-primary">
            Scale & productivity
          </h2>
          <p className="text-small text-text-muted">Active book size and operational throughput</p>
        </div>
        <ExecutiveKpiGrid>
          <KpiCard
            variant="executive"
            label="Active groups"
            icon={<UsersRound className="h-4 w-4" aria-hidden="true" />}
            value={operational.activeGroups ?? 0}
          />
          <KpiCard
            variant="executive"
            label="Active borrowers"
            icon={<UserRound className="h-4 w-4" aria-hidden="true" />}
            value={operational.activeBorrowers ?? 0}
          />
          <KpiCard
            variant="executive"
            label="Active loans"
            icon={<HandCoins className="h-4 w-4" aria-hidden="true" />}
            value={operational.activeLoans ?? 0}
          />
          <KpiCard
            variant="executive"
            label="Closed loans"
            icon={<CircleCheck className="h-4 w-4" aria-hidden="true" />}
            value={operational.closedLoans ?? 0}
          />
          <KpiCard
            variant="executive"
            label="Reconciliation alerts"
            icon={<BellRing className="h-4 w-4" aria-hidden="true" />}
            value={operational.reconciliationAlerts ?? 0}
            trend="Pending review + missing submits"
          />
          <KpiCard
            variant="executive"
            label="Notifications sent"
            icon={<Send className="h-4 w-4" aria-hidden="true" />}
            value={operational.notificationSent ?? 0}
            trend="Last 30 days"
          />
        </ExecutiveKpiGrid>
      </section>
    </div>
  );
}
