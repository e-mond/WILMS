import { describe, expect, it } from 'vitest';
import { groupPendingApplicationsByCommunityAndDate } from '@/utils/approval-queue-grouping';
import { buildGroupSystemId } from '@/utils/group-system-id';
import type { PendingApplicationSummary } from '@/types/borrower';

describe('group-system-id', () => {
  it('builds community-month-sequence ids', () => {
    expect(buildGroupSystemId('Accra Central', new Date('2026-06-12T10:00:00.000Z'), 1)).toBe(
      'Accra-Central-June-001',
    );
  });
});

describe('approval-queue-grouping', () => {
  it('groups pending applications by community and registration date', () => {
    const applications: PendingApplicationSummary[] = [
      {
        id: 'a-1',
        fullName: 'Applicant A',
        phone: '+233200000001',
        community: 'Accra Central',
        registeredAt: '2026-06-12T10:00:00.000Z',
        registeredByOfficerName: 'Officer One',
      },
      {
        id: 'a-2',
        fullName: 'Applicant B',
        phone: '+233200000002',
        community: 'Accra Central',
        registeredAt: '2026-06-12T11:00:00.000Z',
        registeredByOfficerName: 'Officer One',
      },
      {
        id: 'a-3',
        fullName: 'Applicant C',
        phone: '+233200000003',
        community: 'Accra Central',
        registeredAt: '2026-06-13T09:00:00.000Z',
        registeredByOfficerName: 'Officer One',
      },
    ];

    const grouped = groupPendingApplicationsByCommunityAndDate(applications);

    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.community).toBe('Accra Central');
    expect(grouped[0]?.dateGroups).toHaveLength(2);
    expect(grouped[0]?.dateGroups[0]?.applications).toHaveLength(1);
    expect(grouped[0]?.dateGroups[1]?.applications).toHaveLength(2);
  });
});
