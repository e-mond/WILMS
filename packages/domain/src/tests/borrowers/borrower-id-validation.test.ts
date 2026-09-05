import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listBorrowers: vi.fn(),
}));

vi.mock('../../db/client.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../db/client.js')>();
  return {
    ...actual,
    getDb: vi.fn(),
    isDatabaseEnabled: () => false,
  };
});

vi.mock('../../db/persistence.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../db/persistence.js')>();
  return {
    ...actual,
    listBorrowers: mocks.listBorrowers,
  };
});

import { checkId } from '../../modules/borrowers/service.js';
import { normalizeBorrowerId, validateBorrowerId } from '@wilms/shared-validation';

describe('borrower voter ID validation (domain)', () => {
  beforeEach(() => {
    mocks.listBorrowers.mockReset();
    mocks.listBorrowers.mockResolvedValue([]);
  });

  it('treats A01010 as a valid voter ID and normalizes case', () => {
    expect(validateBorrowerId('VOTER_ID', 'A01010').valid).toBe(true);
    expect(normalizeBorrowerId('VOTER_ID', 'a01010')).toBe('A01010');
  });

  it('rejects invalid voter IDs with a useful message', () => {
    const result = validateBorrowerId('VOTER_ID', '!!');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/voter id/i);
  });

  it('leaves Ghana Card and Passport rules unchanged', () => {
    expect(validateBorrowerId('GHANA_CARD', 'GHA-123456789-0').valid).toBe(true);
    expect(validateBorrowerId('GHANA_CARD', 'A01010').valid).toBe(false);
    expect(validateBorrowerId('PASSPORT', 'G1234567').valid).toBe(true);
  });

  it('detects duplicate voter IDs using normalized alphanumeric values', async () => {
    mocks.listBorrowers.mockResolvedValue([
      {
        id: 'b1',
        idType: 'VOTER_ID',
        idNumber: 'A01010',
        fullName: 'Ama',
        phone: '0240000001',
        status: 'PENDING',
        hasActiveLoan: false,
        groupName: '',
        community: 'Accra',
        registeredAt: new Date().toISOString(),
        registeredByOfficerId: 'officer-1',
        profile: {},
      },
    ]);

    const duplicate = await checkId('VOTER_ID', 'a01010');
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.available).toBe(false);

    const available = await checkId('VOTER_ID', 'B99999');
    expect(available.duplicate).toBe(false);
    expect(available.available).toBe(true);
  });
});
