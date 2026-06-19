import type { DashboardSummary } from '@/types/dashboard';
import type { IDashboardService } from '@/types/services';
import { getDashboardDemoDataset } from '@/services/mock/factories/dashboard-demo.factory';
import { buildBorrowerSegments, buildDashboardSummary } from '@/utils/dashboard-summary';
import { simulateDelay } from '@/services/mock/delay';

const dashboardServiceMock: IDashboardService = {
  async getDashboardSummary(): Promise<DashboardSummary> {
    await simulateDelay();

    const dataset = getDashboardDemoDataset();

    return buildDashboardSummary({
      borrowers: dataset.borrowers,
      loans: dataset.loans,
      transactions: dataset.transactions,
      groupRisk: dataset.groupRisk,
      schedulesByLoanId: dataset.schedulesByLoanId,
      referenceDate: dataset.referenceDate,
      overrides: {
        kpis: dataset.referenceKpis,
        borrowerSegments: buildBorrowerSegments(
          dataset.borrowers,
          dataset.loans,
          dataset.schedulesByLoanId,
        ),
        collectorPerformance: dataset.referenceTableCollectorPerformance,
        cycleMetrics: dataset.referenceCycleMetrics,
        recentAlerts: dataset.referenceAlerts,
      },
    });
  },
};

export default dashboardServiceMock;
