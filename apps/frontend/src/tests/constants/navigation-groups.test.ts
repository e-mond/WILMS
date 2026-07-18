import { describe, expect, it } from 'vitest';
import {
  SUPER_ADMIN_NAV,
  COLLECTOR_NAV,
  groupShellNavItems,
  SHELL_NAV_GROUP_LABELS,
} from '@/constants/navigation';

describe('groupShellNavItems', () => {
  it('groups Super Admin nav into progressive-disclosure categories', () => {
    const groups = groupShellNavItems(SUPER_ADMIN_NAV);
    const labels = groups.map((group) => group.label).filter(Boolean);

    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.overview);
    expect(labels).toContain('Daily Operations');
    expect(SHELL_NAV_GROUP_LABELS.operations).toBe('Daily Operations');
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.financial);
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.people);
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.reports);
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.communication);
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.administration);
    expect(labels).toContain(SHELL_NAV_GROUP_LABELS.system);

    const flatCount = groups.reduce((sum, group) => sum + group.items.length, 0);
    expect(flatCount).toBe(SUPER_ADMIN_NAV.length);
  });

  it('preserves Collector nav items across groups', () => {
    const groups = groupShellNavItems(COLLECTOR_NAV);
    const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));
    expect(hrefs.sort()).toEqual(COLLECTOR_NAV.map((item) => item.href).sort());
    expect(hrefs).toHaveLength(COLLECTOR_NAV.length);
  });

  it('returns a single ungrouped bucket when items lack group metadata', () => {
    const groups = groupShellNavItems([{ href: '/x', label: 'X' }]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupId).toBe('ungrouped');
    expect(groups[0]?.items).toHaveLength(1);
  });
});
