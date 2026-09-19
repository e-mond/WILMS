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

  it('treats a 10-digit voter ID as valid and preserves leading zeroes', () => {
    expect(validateBorrowerId('VOTER_ID', '0123456789').valid).toBe(true);
    expect(normalizeBorrowerId('VOTER_ID', '0123456789')).toBe('0123456789');
  });

  it('rejects invalid voter IDs with a clear message', () => {
    const result = validateBorrowerId('VOTER_ID', 'A123456789');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Voter ID must contain exactly 10 digits.');
  });

  it('rejects bypassed client values on the server path via assert-compatible validation', () => {
    expect(validateBorrowerId('VOTER_ID', '123456789').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '01234-56789').valid).toBe(false);
    expect(validateBorrowerId('VOTER_ID', '01234 56789').valid).toBe(false);
  });

  it('leaves Ghana Card and Passport rules unchanged', () => {
    expect(validateBorrowerId('GHANA_CARD', 'GHA-123456789-0').valid).toBe(true);
    expect(validateBorrowerId('GHANA_CARD', 'A123456789').valid).toBe(false);
    expect(validateBorrowerId('PASSPORT', 'G1234567').valid).toBe(true);
  });

  it('detects duplicate voter IDs using exact 10-digit string values', async () => {
    mocks.listBorrowers.mockResolvedValue([
      {
        id: 'b1',
        idType: 'VOTER_ID',
        idNumber: '0123456789',
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

    const duplicate = await checkId('VOTER_ID', '0123456789');
    expect(duplicate.duplicate).toBe(true);
    expect(duplicate.available).toBe(false);

    const available = await checkId('VOTER_ID', '0987654321');
    expect(available.duplicate).toBe(false);
    expect(available.available).toBe(true);
  });
});
