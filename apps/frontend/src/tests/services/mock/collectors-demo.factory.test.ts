import { beforeEach, describe, expect, it } from 'vitest';
import {
  COLLECTORS_REFERENCE_COUNT,
  COLLECTORS_REFERENCE_FEATURED_COLLECTOR,
  COLLECTORS_REFERENCE_RATE_DISTRIBUTION,
  COLLECTORS_REFERENCE_SUMMARY,
} from '@/constants/collectors-reference-scale';
import {
  collectorsDatasetMatchesReference,
  generateCollectorsDemoDataset,
  resetCollectorsDemoDataset,
} from '@/services/mock/factories/collectors-demo.factory';
import collectorManagementServiceMock from '@/services/mock/collectorManagementService.mock';

describe('collectors-demo.factory', () => {
  beforeEach(() => {
    resetCollectorsDemoDataset();
  });

  it('generates 34 collectors at reference scale', () => {
    const dataset = generateCollectorsDemoDataset(42);

    expect(dataset.collectors).toHaveLength(COLLECTORS_REFERENCE_COUNT);
    expect(collectorsDatasetMatchesReference(dataset)).toBe(true);
  });

  it('pins COL-011 Kwame Asante from the reference image', () => {
    const dataset = generateCollectorsDemoDataset(42);
    const featured = dataset.collectors.find(
      (collector) => collector.id === COLLECTORS_REFERENCE_FEATURED_COLLECTOR.id,
    );

    expect(featured).toMatchObject({
      id: 'COL-011',
      displayName: 'Kwame Asante',
      zone: 'Madina, Accra',
      collectionRatePercent: 100,
      streakWeeks: 5,
    });
  });

  it('matches reference KPI summary values', () => {
    const dataset = generateCollectorsDemoDataset(42);

    expect(dataset.summary).toEqual({
      totalCollectors: COLLECTORS_REFERENCE_SUMMARY.totalCollectors,
      avgCollectionRatePercent: COLLECTORS_REFERENCE_SUMMARY.avgCollectionRatePercent,
      belowSeventyPercent: COLLECTORS_REFERENCE_SUMMARY.belowSeventyPercent,
      activeToday: COLLECTORS_REFERENCE_SUMMARY.activeToday,
    });
  });

  it('matches reference team rate distribution', () => {
    const dataset = generateCollectorsDemoDataset(42);

    expect(dataset.rateDistribution).toEqual(COLLECTORS_REFERENCE_RATE_DISTRIBUTION);
  });

  it('is deterministic for the same seed', () => {
    const first = generateCollectorsDemoDataset(99);
    const second = generateCollectorsDemoDataset(99);

    expect(first.collectors[0]?.displayName).toBe(second.collectors[0]?.displayName);
    expect(first.collectors[15]?.zone).toBe(second.collectors[15]?.zone);
  });

  it('includes alert timestamps for relative display', () => {
    const dataset = generateCollectorsDemoDataset(42);

    expect(dataset.alerts.every((alert) => alert.createdAt)).toBe(true);
    expect(dataset.collectors.every((collector) => collector.cycleLabel)).toBe(true);
  });
});

describe('collectorManagementService.mock', () => {
  beforeEach(() => {
    resetCollectorsDemoDataset();
  });

  it('serves reference-scale collector list from demo factory', async () => {
    const response = await collectorManagementServiceMock.listCollectors();

    expect(response.collectors).toHaveLength(34);
    expect(response.summary.avgCollectionRatePercent).toBe(84.2);
    expect(response.rateDistribution.needsAttention).toBe(6);
  });
});
