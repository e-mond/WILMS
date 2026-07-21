import { describe, expect, it, vi } from 'vitest';

const mockGetBorrower = vi.hoisted(() => vi.fn());
const mockSaveBorrower = vi.hoisted(() => vi.fn());

vi.mock('../../db/persistence.js', () => ({
  BORROWER_STATUS: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    BLACKLISTED: 'BLACKLISTED',
  },
  getBorrower: mockGetBorrower,
  saveBorrower: mockSaveBorrower,
  listBorrowers: vi.fn(async () => []),
  nextBorrowerId: vi.fn(() => 'borrower-next'),
  deleteBorrower: vi.fn(async () => undefined),
}));

vi.mock('../../infrastructure/audit/audit-log.js', () => ({
  appendAuditEntry: vi.fn(),
}));

vi.mock('../../modules/group-formation/service.js', () => ({
  processApprovedBorrower: vi.fn(async () => undefined),
}));

vi.mock('../../infrastructure/notifications/event-dispatch.js', () => ({
  notifyRegistrationApproved: vi.fn(),
}));

describe('borrower approval SoD', () => {
  it('blocks the submitting officer from approving their own registration', async () => {
    mockGetBorrower.mockResolvedValue({
      id: 'borrower-1',
      fullName: 'Ama Mensah',
      phone: '0240000001',
      status: 'PENDING',
      registeredByOfficerId: 'officer-1',
      community: 'Accra',
      groupName: '',
      registeredAt: new Date().toISOString(),
      profile: {},
    });

    const { approveBorrower } = await import('../../modules/borrowers/service.js');
    await expect(approveBorrower('borrower-1', 'officer-1')).rejects.toThrow(/FORBIDDEN:/);
    expect(mockSaveBorrower).not.toHaveBeenCalled();
  });
});
