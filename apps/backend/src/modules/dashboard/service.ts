import { formatUserDisplayId } from '@wilms/shared-utils';
import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { listBorrowers, listPayments } from '../../db/persistence.js';
import { isDatabaseEnabled } from '../../db/client.js';
import * as userRepo from '../../repositories/user.repository.js';
import { listGroupsResponse } from '../groups/service.js';
import { buildDashboardFinancialOverview } from './financial-overview.js';

export interface DashboardFinancialOverview {
  capital: {
    totalCapitalAvailablePesewas: number;
    totalCapitalInjectedPesewas: number;
    currentAvailableBalancePesewas: number;
  };
  lending: {
    totalLoanAmountDisbursedPesewas: number;
    totalActiveLoans: number;
    totalClosedLoans: number;
  };
  collections: {
    totalAmountCollectedPesewas: number;
    outstandingBalancePesewas: number;
    amountDueThisWeekPesewas: number;
    overdueAmountPesewas: number;
    collectionRatePercent: number;
  };
  adminFees: {
    totalAdminFeesExpectedPesewas: number;
    totalAdminFeesCollectedPesewas: number;
    outstandingAdminFeesPesewas: number;
  };
  expenses: {
    totalExpensesPesewas: number;
    operationalCostsPesewas: number;
    cashOutflowPesewas: number;
  };
  cashFlow: {
    moneyIn: {
      loanCollectionsPesewas: number;
      adminFeesPesewas: number;
      capitalDepositsPesewas: number;
      otherIncomePesewas: number;
      totalPesewas: number;
    };
    moneyOut: {
      loanDisbursementsPesewas: number;
      operationalExpensesPesewas: number;
      refundsPesewas: number;
      adjustmentsPesewas: number;
      totalPesewas: number;
    };
    netPositionPesewas: number;
  };
}

export interface DashboardSummary {
  generatedAt: string;
  kpis: Array<{
    id: string;
    label: string;
    amountPesewas: number;
    valueKind?: 'currency' | 'count';
    trendLabel?: string;
    trendDirection?: 'up' | 'down' | 'neutral';
    trendTone?: 'gold' | 'success' | 'danger' | 'default';
    valueTone?: 'gold' | 'success' | 'danger' | 'default';
  }>;
  borrowerSegments: Array<{
    id: string;
    label: string;
    count: number;
    tone: 'active' | 'atRisk' | 'defaulted' | 'blacklisted' | 'pending';
  }>;
  collectorPerformance: Array<{
    collectorId: string;
    collectorDisplayId: string;
    name: string;
    expectedPesewas: number;
    actualPesewas: number;
    collectionRatePercent: number;
    variancePesewas: number;
  }>;
  groupRisk: Array<{
    label: string;
    count: number;
    percent: number;
    tone: 'low' | 'atRisk' | 'flagged' | 'suspended';
  }>;
  totalGroups: number;
  cycleMetrics: Array<{ label: string; value: string }>;
  recentAlerts: Array<{
    id: string;
    severity: 'danger' | 'warning' | 'info';
    category: string;
    message: string;
    createdAt: string;
    icon: 'danger' | 'warning' | 'info' | 'edit';
  }>;
  financialOverview: DashboardFinancialOverview;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [borrowers, payments, groupsResponse, financialOverview] = await Promise.all([
    listBorrowers(),
    listPayments(),
    listGroupsResponse(),
    buildDashboardFinancialOverview(),
  ]);

  const groups = groupsResponse.groups;

  const borrowerSegments = [
    {
      id: 'active',
      label: 'Active',
      count: borrowers.filter((entry) => entry.status === BORROWER_STATUS.APPROVED).length,
      tone: 'active' as const,
    },
    {
      id: 'at-risk',
      label: 'At risk',
      count: borrowers.filter((entry) => entry.status === BORROWER_STATUS.AT_RISK).length,
      tone: 'atRisk' as const,
    },
    {
      id: 'defaulted',
      label: 'Defaulted',
      count: borrowers.filter((entry) => entry.status === BORROWER_STATUS.DEFAULTED).length,
      tone: 'defaulted' as const,
    },
    {
      id: 'blacklisted',
      label: 'Blacklisted',
      count: borrowers.filter((entry) => entry.status === BORROWER_STATUS.BLACKLISTED).length,
      tone: 'blacklisted' as const,
    },
    {
      id: 'pending',
      label: 'Pending',
      count: borrowers.filter((entry) => entry.status === BORROWER_STATUS.PENDING).length,
      tone: 'pending' as const,
    },
  ];

  const paymentsByCollector = new Map<string, number>();
  for (const payment of payments) {
    paymentsByCollector.set(
      payment.collectorId,
      (paymentsByCollector.get(payment.collectorId) ?? 0) + payment.amountPesewas,
    );
  }

  let collectorPerformance: DashboardSummary['collectorPerformance'] = [];
  if (isDatabaseEnabled()) {
    const collectors = await userRepo.listCollectors();
    collectorPerformance = collectors.map(({ user }) => {
      const actualPesewas = paymentsByCollector.get(user.id) ?? 0;
      const expectedPesewas = actualPesewas;
      const collectionRatePercent =
        expectedPesewas === 0 ? 0 : Math.round((actualPesewas / expectedPesewas) * 100);
      return {
        collectorId: user.id,
        collectorDisplayId: formatUserDisplayId({ id: user.id }),
        name: user.displayName,
        expectedPesewas,
        actualPesewas,
        collectionRatePercent,
        variancePesewas: actualPesewas - expectedPesewas,
      };
    });
  } else {
    collectorPerformance = Array.from(paymentsByCollector.entries()).map(([collectorId, actualPesewas], index) => ({
      collectorId,
      collectorDisplayId: formatUserDisplayId({ id: collectorId, sequence: index + 1 }),
      name: 'Collector',
      expectedPesewas: actualPesewas,
      actualPesewas,
      collectionRatePercent: actualPesewas > 0 ? 100 : 0,
      variancePesewas: 0,
    }));
  }

  const totalGroups = groups.length;
  const { riskDistribution } = groupsResponse;
  const groupRisk: DashboardSummary['groupRisk'] = [
    {
      label: 'Low risk',
      count: riskDistribution.lowRisk,
      percent: totalGroups > 0 ? Math.round((riskDistribution.lowRisk / totalGroups) * 100) : 0,
      tone: 'low',
    },
    {
      label: 'At risk',
      count: riskDistribution.atRisk,
      percent: totalGroups > 0 ? Math.round((riskDistribution.atRisk / totalGroups) * 100) : 0,
      tone: 'atRisk',
    },
    {
      label: 'Flagged',
      count: riskDistribution.flagged,
      percent: totalGroups > 0 ? Math.round((riskDistribution.flagged / totalGroups) * 100) : 0,
      tone: 'flagged',
    },
    {
      label: 'Suspended',
      count: riskDistribution.suspended,
      percent: totalGroups > 0 ? Math.round((riskDistribution.suspended / totalGroups) * 100) : 0,
      tone: 'suspended',
    },
  ];

  return {
    generatedAt: new Date().toISOString(),
    kpis: [
      {
        id: 'pool',
        label: 'Total Pool Funds',
        amountPesewas: financialOverview.capital.totalCapitalAvailablePesewas,
        valueTone: 'gold',
      },
      {
        id: 'disbursed',
        label: 'Total Disbursed',
        amountPesewas: financialOverview.lending.totalLoanAmountDisbursedPesewas,
        valueTone: 'default',
      },
      {
        id: 'collected',
        label: 'Total Collected',
        amountPesewas: financialOverview.collections.totalAmountCollectedPesewas,
        valueTone: 'success',
      },
      {
        id: 'outstanding',
        label: 'Total Outstanding',
        amountPesewas: financialOverview.collections.outstandingBalancePesewas,
        valueTone: 'default',
      },
    ],
    borrowerSegments,
    collectorPerformance,
    groupRisk,
    totalGroups,
    cycleMetrics: [
      { label: 'Active groups', value: String(totalGroups) },
      { label: 'Registered borrowers', value: String(borrowers.length) },
      { label: 'Payments recorded', value: String(payments.length) },
    ],
    recentAlerts: [],
    financialOverview,
  };
}
