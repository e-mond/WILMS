import { describe, expect, it, beforeEach } from 'vitest';
import { resetGroupsDemoDataset } from '@/services/mock/factories/groups-demo.factory';
import { getGroupsDemoSourceById } from '@/services/mock/factories/groups-demo.factory';
import { resetSyntheticBorrowerProfiles } from '@/services/mock/group-members.resolver';
import { buildGroupDetail } from '@/services/mock/group-detail.builder';

describe('buildGroupDetail', () => {
  beforeEach(() => {
    resetGroupsDemoDataset();
    resetSyntheticBorrowerProfiles();
  });

  it('builds enriched group detail for featured GRP-0041', () => {
    const source = getGroupsDemoSourceById('GRP-0041');
    expect(source).toBeDefined();

    const detail = buildGroupDetail(source!);

    expect(detail.id).toBe('GRP-0041');
    expect(detail.leader.fullName).toBe('Adwoa Nhyira');
    expect(detail.collector.id).toMatch(/^COL-/);
    expect(detail.members.length).toBeGreaterThan(0);
    expect(detail.cycle.label).toMatch(/^Cycle /);
  });
});
