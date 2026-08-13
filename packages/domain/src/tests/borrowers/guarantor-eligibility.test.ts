import { describe, expect, it } from 'vitest';
import {
  evaluateGuarantorEligibility,
  MAX_GUARANTOR_GUARANTEES,
} from '../../modules/borrowers/guarantor-eligibility.js';
import { BORROWER_STATUS } from '../../db/persistence.js';
import type { BorrowerRecord } from '../../db/persistence.js';

function makeBorrower(overrides: Partial<BorrowerRecord> = {}): BorrowerRecord {
  return {
    id: 'borrower-1',
    fullName: 'Ama Mensah',
    phone: '0240000001',
    idType: 'GHANA_CARD',
    idNumber: 'GHA-000000000-1',
    status: BORROWER_STATUS.PENDING,
    hasActiveLoan: false,
    groupName: '',
    community: 'Accra',
    registeredAt: new Date().toISOString(),
    registeredByOfficerId: 'officer-1',
    profile: {
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
      houseAddress: 'House 1',
      gpsAddress: '',
      city: 'Accra',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
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

function linkedBorrower(
  id: string,
  phone: string,
  status: string,
  guarantorPhone = '0240000002',
): BorrowerRecord {
  return makeBorrower({
    id,
    phone,
    idNumber: `GHA-${id}`,
    status: status as BorrowerRecord['status'],
    profile: {
      ...makeBorrower().profile,
      guarantorPhone,
      guarantorName: 'Kofi Boateng',
    },
  });
}

describe('guarantor eligibility', () => {
  it('rejects guarantor when phone matches borrower', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000001',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000001',
      },
      [],
    );

    expect(result.isEligible).toBe(false);
    expect(result.message).toContain('must differ');
  });

  it('allows a guarantor with 0 active guarantees', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000100',
      },
      [],
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(0);
    expect(result.validationStatus).toBe('VALID');
  });

  it('allows a second borrower when the guarantor has 1 active guarantee', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000101',
      },
      [linkedBorrower('b1', '0240000001', BORROWER_STATUS.APPROVED)],
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(1);
    expect(result.isDuplicateRegistration).toBe(false);
    expect(result.validationStatus).toBe('VALID');
  });

  it('allows a third borrower when the guarantor has 2 active guarantees', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000102',
      },
      [
        linkedBorrower('b1', '0240000001', BORROWER_STATUS.APPROVED),
        linkedBorrower('b2', '0240000003', BORROWER_STATUS.PENDING),
      ],
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(2);
  });

  it('blocks a fourth borrower when the guarantor has 3 active guarantees', () => {
    const borrowers = Array.from({ length: MAX_GUARANTOR_GUARANTEES }, (_, index) =>
      linkedBorrower(`b${index}`, `024000000${index + 1}`, BORROWER_STATUS.APPROVED),
    );

    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000199',
      },
      borrowers,
    );

    expect(result.isEligible).toBe(false);
    expect(result.activeGuaranteeCount).toBe(3);
    expect(result.validationStatus).toBe('AT_LIMIT');
    expect(result.message).toContain(String(MAX_GUARANTOR_GUARANTEES));
  });

  it('treats only the same borrower as a duplicate registration', () => {
    const existing = linkedBorrower('b1', '0240000001', BORROWER_STATUS.APPROVED);

    const duplicate = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000001',
      },
      [existing],
    );
    expect(duplicate.isEligible).toBe(false);
    expect(duplicate.validationStatus).toBe('DUPLICATE');
    expect(duplicate.isDuplicateRegistration).toBe(true);

    const differentBorrower = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000888',
      },
      [existing],
    );
    expect(differentBorrower.isEligible).toBe(true);
    expect(differentBorrower.validationStatus).toBe('VALID');
    expect(differentBorrower.activeGuaranteeCount).toBe(1);
  });

  it('matches guarantor phones across 0-prefix and 233-prefix formats', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '+233240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000101',
      },
      [linkedBorrower('b1', '0240000001', BORROWER_STATUS.APPROVED, '0240000002')],
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(1);
  });

  it('does not count rejected or blacklisted registrations toward the limit', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000100',
      },
      [
        linkedBorrower('b1', '0240000001', BORROWER_STATUS.REJECTED),
        linkedBorrower('b2', '0240000003', BORROWER_STATUS.BLACKLISTED),
      ],
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(0);
  });
});
