import { BORROWER_STATUS, type BorrowerDetail, type BorrowerSummary } from '@/types/borrower';

export const MOCK_BORROWER_SUMMARIES: BorrowerSummary[] = [
  {
    id: 'borrower-001',
    fullName: 'Ama Mensah',
    phone: '+233241234567',
    status: BORROWER_STATUS.APPROVED,
    groupName: 'Sunrise Women',
  },
  {
    id: 'borrower-002',
    fullName: 'Efua Boateng',
    phone: '+233209876543',
    status: BORROWER_STATUS.APPROVED,
    groupName: 'Sunrise Women',
  },
];

export const MOCK_BORROWER_DETAILS: Record<string, BorrowerDetail> = {
  'borrower-001': {
    ...MOCK_BORROWER_SUMMARIES[0]!,
    groupId: 'GRP-0033',
    nationalId: 'GHA-123456789-0',
    community: 'Madina',
    registeredAt: '2026-01-15T10:00:00.000Z',
  },
  'borrower-002': {
    ...MOCK_BORROWER_SUMMARIES[1]!,
    groupId: 'GRP-0033',
    nationalId: 'GHA-987654321-0',
    community: 'Madina',
    registeredAt: '2026-02-01T10:00:00.000Z',
  },
};
