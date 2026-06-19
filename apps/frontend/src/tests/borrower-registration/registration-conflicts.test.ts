import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import {
  CONFLICT_SEVERITY,
  REGISTRATION_CONFLICT_CODE,
} from '@/types/borrower-conflicts';

const {
  checkPhone,
  checkId,
  checkName,
  checkActiveLoan,
  checkBlacklist,
} = vi.hoisted(() => ({
  checkPhone: vi.fn(),
  checkId: vi.fn(),
  checkName: vi.fn(),
  checkActiveLoan: vi.fn(),
  checkBlacklist: vi.fn(),
}));

vi.mock('@/services', () => ({
  borrowerService: {
    checkPhone,
    checkId,
    checkName,
    checkActiveLoan,
    checkBlacklist,
  },
}));

import { runRegistrationConflictChecks } from '@/features/borrower-registration/registration-conflicts';

describe('runRegistrationConflictChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('collects blocking conflicts and warnings separately', async () => {
    checkPhone.mockResolvedValue({
      isDuplicate: true,
      existingBorrowerId: 'borrower-001',
      existingBorrowerName: 'Ama Mensah',
    });
    checkId.mockResolvedValue({ isDuplicate: false });
    checkName.mockResolvedValue({
      matches: [
        {
          borrowerId: 'borrower-003',
          fullName: 'Ama Mensan',
          distance: 1,
        },
      ],
    });
    checkActiveLoan.mockResolvedValue({ hasActiveLoan: false });
    checkBlacklist.mockResolvedValue({ isBlacklisted: false });

    const report = await runRegistrationConflictChecks({
      fullName: 'Ama Mensan',
      phone: '+233241234567',
      idType: BORROWER_ID_TYPE.GHANA_CARD,
      idNumber: 'GHA-000000000-1',
    });

    expect(report.blocking).toEqual([
      expect.objectContaining({
        code: REGISTRATION_CONFLICT_CODE.DUPLICATE_PHONE,
        severity: CONFLICT_SEVERITY.BLOCK,
        field: 'phone',
      }),
    ]);
    expect(report.warnings).toEqual([
      expect.objectContaining({
        code: REGISTRATION_CONFLICT_CODE.SIMILAR_NAME,
        severity: CONFLICT_SEVERITY.WARN,
        field: 'fullName',
      }),
    ]);
  });

  it('returns blacklist and active-loan blocking conflicts', async () => {
    checkPhone.mockResolvedValue({ isDuplicate: false });
    checkId.mockResolvedValue({ isDuplicate: false });
    checkName.mockResolvedValue({ matches: [] });
    checkActiveLoan.mockResolvedValue({
      hasActiveLoan: true,
      existingBorrowerId: 'borrower-001',
      existingBorrowerName: 'Ama Mensah',
    });
    checkBlacklist.mockResolvedValue({
      isBlacklisted: true,
      existingBorrowerId: 'borrower-blacklisted-001',
      existingBorrowerName: 'Yaa Darko',
    });

    const report = await runRegistrationConflictChecks({
      fullName: 'Yaa Darko',
      phone: '+233551234567',
      idType: BORROWER_ID_TYPE.GHANA_CARD,
      idNumber: 'GHA-555555555-5',
    });

    expect(report.blocking.map((conflict) => conflict.code)).toEqual([
      REGISTRATION_CONFLICT_CODE.ACTIVE_LOAN,
      REGISTRATION_CONFLICT_CODE.BLACKLISTED,
    ]);
    expect(report.warnings).toEqual([]);
  });
});
