import { describe, expect, it } from 'vitest';
import { guarantorFormFieldsFromLookup } from '@/features/borrower-registration/registration.utils';
import { BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import type { GuarantorLookupResult } from '@/types/guarantor-search';

function lookup(overrides: Partial<GuarantorLookupResult> = {}): GuarantorLookupResult {
  return {
    name: 'Efua Mensah',
    phone: '0205556677',
    phoneDisplay: '020 XXX 6677',
    isGroupLeader: false,
    isBlacklisted: false,
    eligibility: {
      isEligible: true,
      activeGuaranteeCount: 1,
      maxGuarantees: 3,
      isDuplicateRegistration: false,
      validationStatus: 'VALID',
      eligibilityScore: 80,
      riskRating: 'LOW',
      scoreFactors: [],
    },
    guaranteedBorrowers: [],
    ...overrides,
  };
}

describe('guarantor form population from lookup', () => {
  it('populates borrower-sourced identity, ID, and photo', () => {
    const fields = guarantorFormFieldsFromLookup(
      lookup({
        idType: BORROWER_ID_TYPE.VOTER_ID,
        idNumber: 'A01010',
        photoUploadId: 'photo-1',
        photoUrl: 'https://cdn.example/photo.jpg',
      }),
    );

    expect(fields.guarantorName).toBe('Efua Mensah');
    expect(fields.guarantorPhone).toBe('0205556677');
    expect(fields.guarantorIdType).toBe(BORROWER_ID_TYPE.VOTER_ID);
    expect(fields.guarantorIdNumber).toBe('A01010');
    expect(fields.photoFetched).toBe(true);
    expect(fields.idFetched).toBe(true);
  });

  it('populates a guarantor-only record including stored ID and photo', () => {
    const fields = guarantorFormFieldsFromLookup(
      lookup({
        idType: BORROWER_ID_TYPE.GHANA_CARD,
        idNumber: 'GHA-123456789-0',
        photoUploadId: 'guarantor-photo-1',
        photoUrl: 'https://cdn.example/guarantor.jpg',
      }),
    );

    expect(fields.idFetched).toBe(true);
    expect(fields.guarantorIdType).toBe(BORROWER_ID_TYPE.GHANA_CARD);
    expect(fields.guarantorIdNumber).toBe('GHA-123456789-0');
    expect(fields.guarantorPhotoUploadId).toBe('guarantor-photo-1');
    expect(fields.guarantorPreviewUrl).toBe('https://cdn.example/guarantor.jpg');
  });

  it('leaves missing ID editable and does not invent values', () => {
    const fields = guarantorFormFieldsFromLookup(
      lookup({
        photoUploadId: 'guarantor-photo-1',
        photoUrl: 'https://cdn.example/guarantor.jpg',
      }),
    );

    expect(fields.guarantorName).toBe('Efua Mensah');
    expect(fields.guarantorPhone).toBe('0205556677');
    expect(fields.photoFetched).toBe(true);
    expect(fields.idFetched).toBe(false);
    expect(fields.guarantorIdType).toBe('');
    expect(fields.guarantorIdNumber).toBe('');
  });

  it('replaces the previous guarantor completely when a new lookup is applied', () => {
    const first = guarantorFormFieldsFromLookup(
      lookup({
        name: 'Ama Boateng',
        phone: '0241111111',
        idType: BORROWER_ID_TYPE.VOTER_ID,
        idNumber: 'A01010',
        photoUploadId: 'photo-a',
        photoUrl: 'https://cdn.example/a.jpg',
        isGroupLeader: true,
      }),
    );
    const second = guarantorFormFieldsFromLookup(
      lookup({
        name: 'Efua Mensah',
        phone: '0205556677',
        idType: BORROWER_ID_TYPE.GHANA_CARD,
        idNumber: 'GHA-123456789-0',
        photoUploadId: 'photo-b',
        photoUrl: 'https://cdn.example/b.jpg',
      }),
    );

    expect(second.guarantorName).not.toBe(first.guarantorName);
    expect(second.guarantorPhone).toBe('0205556677');
    expect(second.guarantorIdNumber).toBe('GHA-123456789-0');
    expect(second.guarantorPhotoUploadId).toBe('photo-b');
    expect(second.guarantorRelationship).toBe('');
    expect(first.guarantorRelationship).toBe('Group Leader');
  });

  it('clears selected identity so manual entry is not left with stale data', () => {
    const fields = guarantorFormFieldsFromLookup(null);
    expect(fields.guarantorPhone).toBe('');
    expect(fields.guarantorIdType).toBe('');
    expect(fields.guarantorIdNumber).toBe('');
    expect(fields.guarantorPhotoUploadId).toBeUndefined();
    expect(fields.guarantorPreviewUrl).toBeNull();
    expect(fields.guarantorRelationship).toBe('');
    expect(fields.idFetched).toBe(false);
    expect(fields.photoFetched).toBe(false);
  });
});
