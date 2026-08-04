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

  it('rejects guarantor at active guarantee limit', () => {
    const borrowers = Array.from({ length: MAX_GUARANTOR_GUARANTEES }, (_, index) =>
      makeBorrower({
        id: `borrower-${index}`,
        status: BORROWER_STATUS.APPROVED,
        profile: {
          ...makeBorrower().profile,
          guarantorPhone: '0240000002',
          guarantorName: `Guarantor ${index}`,
        },
      }),
    );

    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
      },
      borrowers,
    );

    expect(result.isEligible).toBe(false);
    expect(result.message).toContain(String(MAX_GUARANTOR_GUARANTEES));
  });

  it('accepts eligible guarantor with capacity remaining', () => {
    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
        borrowerPhone: '0240000001',
      },
      [makeBorrower()],
    );

    expect(result.isEligible).toBe(true);
    expect(result.eligibilityScore).toBeGreaterThan(0);
    expect(result.riskRating).toBeDefined();
  });

  it('does not count pending registrations toward guarantee limit', () => {
    const borrowers = Array.from({ length: MAX_GUARANTOR_GUARANTEES }, (_, index) =>
      makeBorrower({
        id: `borrower-${index}`,
        status: BORROWER_STATUS.PENDING,
        profile: {
          ...makeBorrower().profile,
          guarantorPhone: '0240000002',
          guarantorName: `Guarantor ${index}`,
        },
      }),
    );

    const result = evaluateGuarantorEligibility(
      {
        guarantorPhone: '0240000002',
        guarantorName: 'Kofi Boateng',
      },
      borrowers,
    );

    expect(result.isEligible).toBe(true);
    expect(result.activeGuaranteeCount).toBe(0);
  });
});
