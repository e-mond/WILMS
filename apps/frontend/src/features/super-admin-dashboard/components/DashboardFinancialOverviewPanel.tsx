'use client';

import type { ReactNode } from 'react';
import { CurrencyAmount } from '@/components/data-display';
import type { DashboardFinancialOverview } from '@/types/dashboard';
import { DashboardFinancialStat, DashboardFinancialStatGrid } from '@/features/super-admin-dashboard/components/DashboardFinancialStat';

export interface DashboardFinancialOverviewPanelProps {
  overview: DashboardFinancialOverview;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-background p-wilms-5 sm:p-wilms-6">
      <div className="mb-wilms-5 space-y-wilms-1">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {description ? <p className="text-small text-text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DashboardFinancialOverviewPanel({ overview }: DashboardFinancialOverviewPanelProps) {
  return (
    <div className="space-y-wilms-6">
      <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        <Section title="Capital" description="Pool funds and available lending capital">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Total capital available"
              value={<CurrencyAmount value={overview.capital.totalCapitalAvailablePesewas} />}
            />
            <DashboardFinancialStat
              label="Total capital injected"
              value={<CurrencyAmount value={overview.capital.totalCapitalInjectedPesewas} />}
            />
            <DashboardFinancialStat
              label="Current available balance"
              value={<CurrencyAmount value={overview.capital.currentAvailableBalancePesewas} />}
            />
          </DashboardFinancialStatGrid>
        </Section>

        <Section title="Lending" description="Disbursement and loan portfolio status">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Total loan amount disbursed"
              value={<CurrencyAmount value={overview.lending.totalLoanAmountDisbursedPesewas} />}
            />
            <DashboardFinancialStat
              label="Active loans"
              value={overview.lending.totalActiveLoans.toLocaleString()}
            />
            <DashboardFinancialStat
              label="Closed loans"
              value={overview.lending.totalClosedLoans.toLocaleString()}
            />
          </DashboardFinancialStatGrid>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        <Section title="Collections" description="Repayment performance and arrears">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Total amount collected"
              value={<CurrencyAmount value={overview.collections.totalAmountCollectedPesewas} />}
              tone="success"
            />
            <DashboardFinancialStat
              label="Outstanding balance"
              value={<CurrencyAmount value={overview.collections.outstandingBalancePesewas} />}
            />
            <DashboardFinancialStat
              label="Amount due this week"
              value={<CurrencyAmount value={overview.collections.amountDueThisWeekPesewas} />}
            />
            <DashboardFinancialStat
              label="Overdue amount"
              value={<CurrencyAmount value={overview.collections.overdueAmountPesewas} />}
              tone={overview.collections.overdueAmountPesewas > 0 ? 'danger' : 'default'}
            />
            <DashboardFinancialStat
              label="Collection rate"
              value={`${overview.collections.collectionRatePercent}%`}
              tone={
                overview.collections.collectionRatePercent >= 95
                  ? 'success'
                  : overview.collections.collectionRatePercent < 70
                    ? 'danger'
                    : 'default'
              }
            />
          </DashboardFinancialStatGrid>
        </Section>

        <Section title="Admin fees" description="Pre-disbursement fee collection">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Total admin fees expected"
              value={<CurrencyAmount value={overview.adminFees.totalAdminFeesExpectedPesewas} />}
            />
            <DashboardFinancialStat
              label="Total admin fees collected"
              value={<CurrencyAmount value={overview.adminFees.totalAdminFeesCollectedPesewas} />}
              tone="success"
            />
            <DashboardFinancialStat
              label="Outstanding admin fees"
              value={<CurrencyAmount value={overview.adminFees.outstandingAdminFeesPesewas} />}
              tone={overview.adminFees.outstandingAdminFeesPesewas > 0 ? 'danger' : 'default'}
            />
          </DashboardFinancialStatGrid>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-wilms-6 xl:grid-cols-2">
        <Section title="Expenses" description="Approved operational spend">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Total expenses"
              value={<CurrencyAmount value={overview.expenses.totalExpensesPesewas} />}
            />
            <DashboardFinancialStat
              label="Operational costs (month)"
              value={<CurrencyAmount value={overview.expenses.operationalCostsPesewas} />}
            />
            <DashboardFinancialStat
              label="Cash outflow (week)"
              value={<CurrencyAmount value={overview.expenses.cashOutflowPesewas} />}
            />
          </DashboardFinancialStatGrid>
        </Section>

        <Section title="Cash flow" description="Money in, money out, and net position">
          <DashboardFinancialStatGrid>
            <DashboardFinancialStat
              label="Money in — collections"
              value={<CurrencyAmount value={overview.cashFlow.moneyIn.loanCollectionsPesewas} />}
            />
            <DashboardFinancialStat
              label="Money in — admin fees"
              value={<CurrencyAmount value={overview.cashFlow.moneyIn.adminFeesPesewas} />}
            />
            <DashboardFinancialStat
              label="Money in — capital deposits"
              value={<CurrencyAmount value={overview.cashFlow.moneyIn.capitalDepositsPesewas} />}
            />
            <DashboardFinancialStat
              label="Money out — disbursements"
              value={<CurrencyAmount value={overview.cashFlow.moneyOut.loanDisbursementsPesewas} />}
            />
            <DashboardFinancialStat
              label="Money out — expenses"
              value={<CurrencyAmount value={overview.cashFlow.moneyOut.operationalExpensesPesewas} />}
            />
            <DashboardFinancialStat
              label="Net position"
              value={<CurrencyAmount value={overview.cashFlow.netPositionPesewas} />}
              tone={overview.cashFlow.netPositionPesewas >= 0 ? 'success' : 'danger'}
            />
          </DashboardFinancialStatGrid>
        </Section>
      </div>
    </div>
  );
}
