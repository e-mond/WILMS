import { describe, expect, it } from 'vitest';
import {
  generateRiskFlagsDemoDataset,
  resetRiskFlagsDemoDataset,
  riskFlagsDatasetMatchesReference,
} from '@/services/mock/factories/risk-flags-demo.factory';
import { FLAG_TYPE } from '@/types/risk-flag';

describe('risk-flags-demo.factory', () => {
  it('generates a reference-scale dataset with computed summaries', () => {
    resetRiskFlagsDemoDataset();
    const dataset = generateRiskFlagsDemoDataset();

    expect(riskFlagsDatasetMatchesReference(dataset)).toBe(true);
    expect(dataset.summary.openFlags).toBeGreaterThan(0);
    expect(dataset.typeBreakdown.find((entry) => entry.flagType === FLAG_TYPE.MISSED_PAYMENT)?.count).toBe(
      29,
    );
    expect(dataset.recentBlacklists.length).toBeGreaterThan(0);
    expect(dataset.recentBlacklists.every((entry) => entry.name.length > 0)).toBe(true);
  });
});
