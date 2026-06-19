import { beforeEach, describe, expect, it } from 'vitest';
import {
  DASHBOARD_REFERENCE_BORROWER_SEGMENTS,
  DASHBOARD_REFERENCE_COLLECTOR_COUNT,
  DASHBOARD_REFERENCE_CYCLE_METRICS,
  DASHBOARD_REFERENCE_GROUP_COUNT,
  DASHBOARD_REFERENCE_KPIS,
} from '@/constants/dashboard-reference-scale';
import {
  generateDashboardDemoDataset,
  resetDashboardDemoDataset,
} from '@/services/mock/factories/dashboard-demo.factory';

describe('dashboard-demo.factory', () => {
  beforeEach(() => {
    resetDashboardDemoDataset();
  });

  it('generates reference-scale borrower counts including pending', () => {
    const dataset = generateDashboardDemoDataset(42);
    const pending = dataset.borrowers.filter((borrower) => borrower.status === 'PENDING').length;

    expect(dataset.borrowers).toHaveLength(DASHBOARD_REFERENCE_BORROWER_SEGMENTS.total);
    expect(pending).toBe(DASHBOARD_REFERENCE_BORROWER_SEGMENTS.pending);
  });

  it('generates 100 groups with reference risk distribution', () => {
    const dataset = generateDashboardDemoDataset(42);

    expect(dataset.groupRisk).toHaveLength(DASHBOARD_REFERENCE_GROUP_COUNT);
    const lowRisk = dataset.groupRisk.filter((group) => group.riskLevel === 'LOW_RISK').length;
    const atRisk = dataset.groupRisk.filter((group) => group.riskLevel === 'AT_RISK').length;
    const flagged = dataset.groupRisk.filter((group) => group.riskLevel === 'FLAGGED').length;
    const suspended = dataset.groupRisk.filter((group) => group.riskLevel === 'SUSPENDED').length;

    expect(lowRisk).toBe(58);
    expect(atRisk).toBe(22);
    expect(flagged).toBe(13);
    expect(suspended).toBe(7);
    expect(dataset.referenceCollectorPerformance).toHaveLength(
      DASHBOARD_REFERENCE_COLLECTOR_COUNT,
    );
    expect(dataset.referenceTableCollectorPerformance).toHaveLength(5);
    expect(dataset.referenceTableCollectorPerformance[0]?.name).toBe('Kwame Asante');
  });

  it('targets reference KPI and cycle metric amounts', () => {
    const dataset = generateDashboardDemoDataset(42);

    expect(dataset.referenceKpis.find((kpi) => kpi.id === 'disbursed')?.amountPesewas).toBe(
      DASHBOARD_REFERENCE_KPIS.disbursedPesewas,
    );
    expect(dataset.referenceKpis.find((kpi) => kpi.id === 'collected')?.amountPesewas).toBe(
      DASHBOARD_REFERENCE_KPIS.collectedPesewas,
    );
    expect(
      dataset.referenceCycleMetrics.find((metric) => metric.label === 'Active Groups')?.value,
    ).toBe(String(DASHBOARD_REFERENCE_CYCLE_METRICS.activeGroups));
  });

  it('includes all dashboard alert categories', () => {
    const dataset = generateDashboardDemoDataset(42);
    const categories = new Set(dataset.referenceAlerts.map((alert) => alert.category));

    expect(categories.size).toBe(12);
    expect(dataset.referenceAlerts.every((alert) => alert.createdAt && alert.href)).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    const first = generateDashboardDemoDataset(99);
    const second = generateDashboardDemoDataset(99);

    expect(first.referenceCollectorPerformance[0]?.name).toBe(
      second.referenceCollectorPerformance[0]?.name,
    );
    expect(first.transactions.length).toBe(second.transactions.length);
  });
});
