import { BORROWER_STATUS } from '@wilms/shared-contracts';
import { listBorrowers, listPayments } from '../../db/persistence.js';
import { isDatabaseEnabled } from '../../db/client.js';
import * as loanRepo from '../../repositories/loan.repository.js';
import * as userRepo from '../../repositories/user.repository.js';
import { decimalToPesewas } from '../../domain/money.js';
import { listGroupsResponse } from '../groups/service.js';

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
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [borrowers, payments, groupsResponse] = await Promise.all([
    listBorrowers(),
    listPayments(),
    listGroupsResponse(),
  ]);

  const groups = groupsResponse.groups;

  const today = new Date().toISOString().slice(0, 10);
  const todayPayments = payments.filter((payment) => payment.paymentDate === today);
  const collectedTodayPesewas = todayPayments.reduce((sum, payment) => sum + payment.amountPesewas, 0);
  const collectedTotalPesewas = payments.reduce((sum, payment) => sum + payment.amountPesewas, 0);

  let outstandingPesewas = 0;
  if (isDatabaseEnabled()) {
    const loans = await loanRepo.listLoans({ externalStatus: 'ACTIVE' });
    outstandingPesewas = loans.reduce(
      (sum, loan) => sum + decimalToPesewas(loan.loanBalance),
      0,
    );
  }

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
        name: user.displayName,
        expectedPesewas,
        actualPesewas,
        collectionRatePercent,
        variancePesewas: actualPesewas - expectedPesewas,
      };
    });
  } else {
    collectorPerformance = Array.from(paymentsByCollector.entries()).map(([collectorId, actualPesewas]) => ({
      collectorId,
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
        id: 'collected-today',
        label: 'Collected today',
        amountPesewas: collectedTodayPesewas,
        trendDirection: 'up',
        trendTone: 'success',
        valueTone: 'success',
      },
      {
        id: 'collected-total',
        label: 'Total collected',
        amountPesewas: collectedTotalPesewas,
        valueTone: 'gold',
      },
      {
        id: 'outstanding',
        label: 'Outstanding balance',
        amountPesewas: outstandingPesewas,
        valueTone: 'default',
      },
      {
        id: 'active-borrowers',
        label: 'Active borrowers',
        amountPesewas: borrowerSegments.find((segment) => segment.id === 'active')?.count ?? 0,
        valueKind: 'count',
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
  };
}
