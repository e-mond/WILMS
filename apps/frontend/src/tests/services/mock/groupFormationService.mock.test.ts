import { beforeEach, describe, expect, it } from 'vitest';
import groupFormationServiceMock from '@/services/mock/groupFormationService.mock';
import {
  getAutomatedGroupSources,
  resetGroupFormationStore,
} from '@/services/mock/group-formation.store';
import { resetSystemSettingsStore } from '@/services/mock/settings.store';

describe('groupFormationService.mock', () => {
  beforeEach(() => {
    resetGroupFormationStore();
    resetSystemSettingsStore();
  });

  it('queues approved borrowers until the configured minimum is reached', async () => {
    const community = 'Accra Central';

    for (let index = 0; index < 4; index += 1) {
      const result = await groupFormationServiceMock.processApprovedBorrower({
        borrowerId: `borrower-${index + 1}`,
        fullName: `Borrower ${index + 1}`,
        community,
        approvedAt: '2026-06-12T10:00:00.000Z',
      });

      expect(result.created).toBe(false);
      expect(result.message).toContain(`${index + 1} of 5`);
    }

    expect(getAutomatedGroupSources()).toHaveLength(0);
  });

  it('creates an automated group when the minimum threshold is met', async () => {
    const community = 'Madina, Accra';
    const approvedAt = '2026-06-12T10:00:00.000Z';

    for (let index = 0; index < 4; index += 1) {
      await groupFormationServiceMock.processApprovedBorrower({
        borrowerId: `madina-borrower-${index + 1}`,
        fullName: `Madina Borrower ${index + 1}`,
        community,
        approvedAt,
      });
    }

    const result = await groupFormationServiceMock.processApprovedBorrower({
      borrowerId: 'madina-borrower-5',
      fullName: 'Madina Borrower 5',
      community,
      approvedAt,
    });

    expect(result.created).toBe(true);
    expect(result.groupSystemId).toBe('Madina-June-001');
    expect(result.memberCount).toBe(5);
    expect(getAutomatedGroupSources()).toHaveLength(1);
    expect(getAutomatedGroupSources()[0]?.displayName).toBe('Hope Madina Group 1');
  });

  it('reads min and max group size from settings service', async () => {
    const config = await groupFormationServiceMock.getConfig();

    expect(config).toEqual({ minGroupSize: 5, maxGroupSize: 10 });
  });
});
