import { describe, expect, it, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  listBorrowers: vi.fn(),
  getGuarantorLimits: vi.fn(),
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

vi.mock('../../modules/settings/guarantor-limits.js', () => ({
  getGuarantorLimits: mocks.getGuarantorLimits,
}));

vi.mock('../../infrastructure/uploads/index.js', () => ({
  resolveUploadAccessUrlById: vi.fn(async () => null),
}));

import { BORROWER_STATUS } from '../../db/persistence.js';
import type { BorrowerRecord } from '../../db/persistence.js';
import {
  evaluateGuarantorEligibility,
  MAX_GUARANTOR_GUARANTEES,
} from '../../modules/borrowers/guarantor-eligibility.js';
import {
  lookupGuarantorForRegistration,
  searchGuarantors,
} from '../../modules/borrowers/guarantor-search.js';

function makeBorrower(overrides: Partial<BorrowerRecord> = {}): BorrowerRecord {
  return {
    id: 'borrower-1',
    fullName: 'Gloria Serwaa',
    phone: '0551112233',
    idType: 'VOTER_ID',
    idNumber: '0123456789',
    status: BORROWER_STATUS.APPROVED,
    hasActiveLoan: false,
    groupName: 'Airport Ridge Group 001',
    community: 'Fijai',
    registeredAt: '2026-01-15T00:00:00.000Z',
    registeredByOfficerId: 'officer-1',
    profile: {
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
      houseAddress: 'House 1',
      gpsAddress: '',
      city: 'Fijai',
      region: 'Western',
      district: 'Sekondi',
      businessName: 'Shop',
      businessAddress: 'Market',
      typeOfWork: 'Retail',
      guarantorName: 'Kofi Boateng',
      guarantorPhone: '0240000099',
      guarantorRelationship: 'Friend',
      photoFileName: 'photo.jpg',
      photoMimeType: 'image/jpeg',
    },
    ...overrides,
  };
}

describe('guarantor search and capacity rules', () => {
  beforeEach(() => {
    mocks.listBorrowers.mockReset();
    mocks.getGuarantorLimits.mockReset();
    mocks.getGuarantorLimits.mockResolvedValue({
      maxGuarantorGuarantees: 3,
      maxLeaderGuarantorGuarantees: 5,
    });
  });

  it('searches by full and partial name case-insensitively', async () => {
    mocks.listBorrowers.mockResolvedValue([makeBorrower()]);
    const byFull = await searchGuarantors('Gloria Serwaa');
    const byPartial = await searchGuarantors('gloria');
    expect(byFull.some((hit) => hit.name === 'Gloria Serwaa')).toBe(true);
    expect(byPartial.some((hit) => hit.name === 'Gloria Serwaa')).toBe(true);
    expect(byFull[0]?.phoneDisplay).toMatch(/XXX/);
    expect(byFull[0]?.displayId).toMatch(/^BRW-/);
  });

  it('searches by phone digits', async () => {
    mocks.listBorrowers.mockResolvedValue([makeBorrower()]);
    const hits = await searchGuarantors('055111');
    expect(hits.some((hit) => hit.phone.includes('055111'))).toBe(true);
  });

  it('returns no results for unknown queries', async () => {
    mocks.listBorrowers.mockResolvedValue([makeBorrower()]);
    await expect(searchGuarantors('zzzz-unknown')).resolves.toEqual([]);
  });

  it('looks up a guarantor and returns populate fields without raw UUID as display id', async () => {
    mocks.listBorrowers.mockResolvedValue([makeBorrower()]);
    const lookup = await lookupGuarantorForRegistration({ phone: '0551112233' });
    expect(lookup.name).toBe('Gloria Serwaa');
    expect(lookup.idType).toBe('VOTER_ID');
    expect(lookup.idNumber).toBe('0123456789');
    expect(lookup.displayId).toMatch(/^BRW-/);
    expect(lookup.displayId).not.toBe('borrower-1');
  });

  it('looks up a borrower guarantor from their own identity, not a historical guarantor ID', async () => {
    mocks.listBorrowers.mockResolvedValue([
      makeBorrower({
        profile: {
          ...makeBorrower().profile,
          photoUploadId: 'borrower-photo-1',
        },
      }),
      makeBorrower({
        id: 'other',
        phone: '0241000001',
        idNumber: 'B02020',
        profile: {
          ...makeBorrower().profile,
          guarantorPhone: '0551112233',
          guarantorName: 'Someone Else',
          guarantorIdType: 'GHANA_CARD',
          guarantorIdNumber: 'GHA-999999999-0',
          guarantorPhotoUploadId: 'other-guarantor-photo',
        },
      }),
    ]);

    const lookup = await lookupGuarantorForRegistration({ phone: '0551112233' });
    expect(lookup.name).toBe('Gloria Serwaa');
    expect(lookup.idType).toBe('VOTER_ID');
    expect(lookup.idNumber).toBe('0123456789');
    expect(lookup.photoUploadId).toBe('borrower-photo-1');
    expect(lookup.borrowerId).toBe('borrower-1');
  });

  it('returns stored guarantor ID and photo when the person is not a borrower', async () => {
    mocks.listBorrowers.mockResolvedValue([
      makeBorrower({
        id: 'ama',
        phone: '0241000001',
        profile: {
          ...makeBorrower().profile,
          guarantorName: 'Efua Mensah',
          guarantorPhone: '0205556677',
          guarantorIdType: 'GHANA_CARD',
          guarantorIdNumber: 'GHA-123456789-0',
          guarantorPhotoUploadId: 'guarantor-photo-1',
        },
      }),
    ]);

    const lookup = await lookupGuarantorForRegistration({ phone: '0205556677' });
    expect(lookup.borrowerId).toBeUndefined();
    expect(lookup.name).toBe('Efua Mensah');
    expect(lookup.phone).toBe('0205556677');
    expect(lookup.idType).toBe('GHANA_CARD');
    expect(lookup.idNumber).toBe('GHA-123456789-0');
    expect(lookup.photoUploadId).toBe('guarantor-photo-1');
  });

  it('does not invent ID values when historical guarantor records have none', async () => {
    mocks.listBorrowers.mockResolvedValue([
      makeBorrower({
        id: 'ama',
        phone: '0241000001',
        profile: {
          ...makeBorrower().profile,
          guarantorName: 'Efua Mensah',
          guarantorPhone: '0205556677',
          guarantorPhotoUploadId: 'guarantor-photo-1',
        },
      }),
    ]);

    const lookup = await lookupGuarantorForRegistration({ phone: '0205556677' });
    expect(lookup.name).toBe('Efua Mensah');
    expect(lookup.photoUploadId).toBe('guarantor-photo-1');
    expect(lookup.idType).toBeUndefined();
    expect(lookup.idNumber).toBeUndefined();
  });

  it('prefers a complete historical guarantor record over a newer incomplete one', async () => {
    mocks.listBorrowers.mockResolvedValue([
      makeBorrower({
        id: 'older-complete',
        phone: '0241000001',
        registeredAt: '2025-01-01T00:00:00.000Z',
        profile: {
          ...makeBorrower().profile,
          guarantorName: 'Efua Mensah',
          guarantorPhone: '0205556677',
          guarantorIdType: 'VOTER_ID',
          guarantorIdNumber: 'C03030',
          guarantorPhotoUploadId: 'complete-photo',
        },
      }),
      makeBorrower({
        id: 'newer-incomplete',
        phone: '0241000002',
        registeredAt: '2026-06-01T00:00:00.000Z',
        profile: {
          ...makeBorrower().profile,
          guarantorName: 'Efua Mensah',
          guarantorPhone: '0205556677',
        },
      }),
    ]);

    const lookup = await lookupGuarantorForRegistration({ phone: '0205556677' });
    expect(lookup.idType).toBe('VOTER_ID');
    expect(lookup.idNumber).toBe('C03030');
    expect(lookup.photoUploadId).toBe('complete-photo');
    expect(lookup.name).toBe('Efua Mensah');
  });

  it('still returns stored details when the guarantor is already at the guarantee limit', async () => {
    const guarantorPhone = '0205556677';
    const borrowers = [0, 1, 2].map((index) =>
      makeBorrower({
        id: `b-${index}`,
        phone: `024100000${index}`,
        idNumber: `ID-${index}`,
        status: BORROWER_STATUS.APPROVED,
        profile: {
          ...makeBorrower().profile,
          guarantorName: 'Efua Mensah',
          guarantorPhone,
          guarantorIdType: 'PASSPORT',
          guarantorIdNumber: 'G1234567',
        },
      }),
    );
    mocks.listBorrowers.mockResolvedValue(borrowers);

    const lookup = await lookupGuarantorForRegistration({
      phone: guarantorPhone,
      borrowerPhone: '0241999999',
    });
    expect(lookup.idType).toBe('PASSPORT');
    expect(lookup.idNumber).toBe('G1234567');
    expect(lookup.eligibility.isEligible).toBe(false);
    expect(lookup.eligibility.activeGuaranteeCount).toBe(3);
  });

  it('allows 0–2 of 3 guarantees and rejects 3 of 3', () => {
    const guarantorPhone = '0240000099';
    const borrowers: BorrowerRecord[] = [];

    for (let index = 0; index < 3; index += 1) {
      const result = evaluateGuarantorEligibility(
        {
          guarantorPhone,
          guarantorName: 'Kofi',
          borrowerPhone: `024100000${index}`,
        },
        borrowers,
      );
      expect(result.isEligible).toBe(true);
      expect(result.activeGuaranteeCount).toBe(index);

      borrowers.push(
        makeBorrower({
          id: `b-${index}`,
          phone: `024100000${index}`,
          idNumber: `GHA-00000000${index}-0`,
          profile: {
            ...makeBorrower().profile,
            guarantorPhone,
            guarantorName: 'Kofi',
          },
        }),
      );
    }

    const atLimit = evaluateGuarantorEligibility(
      {
        guarantorPhone,
        guarantorName: 'Kofi',
        borrowerPhone: '0241999999',
      },
      borrowers,
    );
    expect(atLimit.isEligible).toBe(false);
    expect(atLimit.activeGuaranteeCount).toBe(MAX_GUARANTOR_GUARANTEES);
    expect(atLimit.validationStatus).toBe('AT_LIMIT');
  });

  it('allows guaranteeing different borrowers and rejects duplicate for same borrower', () => {
    const guarantorPhone = '0240000099';
    const borrowers = [
      makeBorrower({
        id: 'a',
        phone: '0241000001',
        idNumber: 'ID-A',
        profile: { ...makeBorrower().profile, guarantorPhone, guarantorName: 'Kofi' },
      }),
      makeBorrower({
        id: 'b',
        phone: '0241000002',
        idNumber: 'ID-B',
        profile: { ...makeBorrower().profile, guarantorPhone, guarantorName: 'Kofi' },
      }),
    ];

    const forC = evaluateGuarantorEligibility(
      { guarantorPhone, guarantorName: 'Kofi', borrowerPhone: '0241000003', borrowerIdNumber: 'ID-C' },
      borrowers,
    );
    expect(forC.isEligible).toBe(true);

    const duplicateA = evaluateGuarantorEligibility(
      { guarantorPhone, guarantorName: 'Kofi', borrowerPhone: '0241000001', borrowerIdNumber: 'ID-A' },
      borrowers,
    );
    expect(duplicateA.isEligible).toBe(false);
    expect(duplicateA.isDuplicateRegistration).toBe(true);
    expect(duplicateA.validationStatus).toBe('DUPLICATE');
  });
});
