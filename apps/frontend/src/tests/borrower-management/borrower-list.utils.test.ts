import { describe, expect, it } from 'vitest';
import { BORROWER_STATUS } from '@/types/borrower';
import type { BorrowerSummary } from '@/types/borrower';
import { filterBorrowerSummaries } from '@/features/borrower-management/borrower-list.utils';

const SAMPLE_BORROWERS: BorrowerSummary[] = [
  {
    id: 'borrower-001',
    fullName: 'Ama Mensah',
    phone: '+233241234567',
    status: BORROWER_STATUS.APPROVED,
    groupName: 'Sunrise Women',
  },
  {
    id: 'borrower-004',
    fullName: 'Adjoa Owusu',
    phone: '+233244111222',
    status: BORROWER_STATUS.PENDING,
    groupName: 'Hope Circle',
  },
];

describe('borrower-list.utils', () => {
  it('filters borrowers by search query and status', () => {
    const filtered = filterBorrowerSummaries(SAMPLE_BORROWERS, {
      searchQuery: 'Ama',
      statusFilter: BORROWER_STATUS.APPROVED,
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.id).toBe('borrower-001');
  });
});
