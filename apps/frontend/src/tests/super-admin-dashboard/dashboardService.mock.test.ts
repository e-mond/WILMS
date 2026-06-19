import { beforeEach, describe, expect, it } from 'vitest';
import {
  DASHBOARD_REFERENCE_BORROWER_SEGMENTS,
  DASHBOARD_REFERENCE_CYCLE_METRICS,
  DASHBOARD_REFERENCE_GROUP_COUNT,
  DASHBOARD_REFERENCE_KPIS,
} from '@/constants/dashboard-reference-scale';
import { resetDashboardDemoDataset } from '@/services/mock/factories/dashboard-demo.factory';
import dashboardServiceMock from '@/services/mock/dashboardService.mock';

describe('dashboardService.mock', () => {
  beforeEach(() => {
    resetDashboardDemoDataset();
  });

  it('aggregates reference-scale dashboard summary from demo factories', async () => {
    const summary = await dashboardServiceMock.getDashboardSummary();
    const borrowerTotal = summary.borrowerSegments.reduce(
      (total, segment) => total + segment.count,
      0,
    );

    expect(summary.kpis).toHaveLength(4);
    expect(summary.kpis.find((kpi) => kpi.id === 'pool')?.amountPesewas).toBe(
      DASHBOARD_REFERENCE_KPIS.poolPesewas,
    );
    expect(summary.kpis.find((kpi) => kpi.id === 'disbursed')?.amountPesewas).toBe(
      DASHBOARD_REFERENCE_KPIS.disbursedPesewas,
    );
    expect(borrowerTotal).toBe(DASHBOARD_REFERENCE_BORROWER_SEGMENTS.total);
    expect(summary.borrowerSegments.find((segment) => segment.id === 'pending')?.count).toBe(
      DASHBOARD_REFERENCE_BORROWER_SEGMENTS.pending,
    );
    expect(summary.collectorPerformance).toHaveLength(5);
    expect(summary.collectorPerformance[0]?.name).toBe('Kwame Asante');
    expect(summary.totalGroups).toBe(DASHBOARD_REFERENCE_GROUP_COUNT);
    expect(
      summary.cycleMetrics.find((metric) => metric.label === 'New Loans (MTD)')?.value,
    ).toBe(String(DASHBOARD_REFERENCE_CYCLE_METRICS.newLoansMtd));
    expect(summary.recentAlerts.length).toBe(12);
    expect(summary.recentAlerts[0]?.category).toBeTruthy();
  });
});
