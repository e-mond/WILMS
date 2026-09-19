import { describe, expect, it } from 'vitest';
import {
  BUSINESS_ADDRESS_MAX_LENGTH,
  BUSINESS_PREMISES_NUMBER_MAX_LENGTH,
  GHANA_OCCUPATIONS,
  OTHER_OCCUPATION_VALUE,
  resolveOccupationLabel,
} from '@wilms/shared-contracts';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import {
  borrowerRegistrationSchema,
  businessStepSchema,
} from '@/features/borrower-registration/registration.schema';

function createValidRegistration(overrides: Record<string, unknown> = {}) {
  const photo = new File(['photo'], 'passport.jpg', { type: 'image/jpeg' });
  const guarantorPhoto = new File(['photo'], 'guarantor.jpg', { type: 'image/jpeg' });

  return {
    fullName: 'Ama Mensah',
    dateOfBirth: '1990-01-15',
    gender: BORROWER_GENDER.FEMALE,
    phone: '+233241234567',
    email: '',
    nationality: 'Ghanaian',
    idType: BORROWER_ID_TYPE.GHANA_CARD,
    idNumber: 'GHA-123456789-0',
    houseAddress: '12 Market Road',
    gpsAddress: 'GA-123-4567',
    city: 'Accra',
    region: 'Greater Accra',
    district: 'La Nkwantanang',
    businessName: 'Ama Provisions',
    businessPremisesNumber: 'Stall 18',
    businessAddress: 'Kojokrom Market',
    typeOfWork: 'fresh_fish_seller',
    typeOfWorkOther: '',
    guarantorName: 'Efua Mensah',
    guarantorPhone: '+233209876543',
    guarantorRelationship: 'Sibling',
    guarantorIdType: BORROWER_ID_TYPE.GHANA_CARD,
    guarantorIdNumber: 'GHA-987654321-0',
    guarantorPhoto,
    photo,
    borrowerSignatureUploadId: undefined,
    borrowerThumbprintUploadId: undefined,
    guarantorSignatureUploadId: undefined,
    guarantorThumbprintUploadId: undefined,
    officerSignatureUploadId: undefined,
    borrowerThumbprintManualPlaceholder: false,
    guarantorThumbprintManualPlaceholder: false,
    ...overrides,
  };
}

describe('borrowerRegistrationSchema', () => {
  it('accepts a complete valid registration', () => {
    const result = borrowerRegistrationSchema.safeParse(createValidRegistration());
    expect(result.success).toBe(true);
  });

  it('allows registration without digital signatures or thumbprints', () => {
    const result = borrowerRegistrationSchema.safeParse(createValidRegistration());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.borrowerSignatureUploadId).toBeUndefined();
      expect(result.data.officerSignatureUploadId).toBeUndefined();
    }
  });

  it('allows an empty optional email', () => {
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({ email: '' }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects matching borrower and guarantor phone numbers', () => {
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({ guarantorPhone: '+233241234567' }),
    );

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Guarantor phone must differ from borrower phone.',
    );
  });

  it('accepts a blank business name', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: 'Stall 18',
      businessAddress: 'Kojokrom Market',
      typeOfWork: 'fresh_fish_seller',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a provided business name', () => {
    const result = businessStepSchema.safeParse({
      businessName: 'Gloria Provisions',
      businessPremisesNumber: '',
      businessAddress: 'Market Circle',
      typeOfWork: 'petty_trader',
    });
    expect(result.success).toBe(true);
  });

  it('accepts house / stall / shop number variants up to 30 characters', () => {
    for (const businessPremisesNumber of ['12', '12A', 'Stall 18', 'A'.repeat(30)]) {
      const result = businessStepSchema.safeParse({
        businessName: '',
        businessPremisesNumber,
        businessAddress: 'Kojokrom Market',
        typeOfWork: 'fresh_fish_seller',
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects house / stall / shop numbers longer than 30 characters', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: 'A'.repeat(BUSINESS_PREMISES_NUMBER_MAX_LENGTH + 1),
      businessAddress: 'Kojokrom Market',
      typeOfWork: 'fresh_fish_seller',
    });
    expect(result.success).toBe(false);
  });

  it('accepts Ghanaian business addresses up to 30 characters', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: 'Stall 18',
      businessAddress: 'B'.repeat(BUSINESS_ADDRESS_MAX_LENGTH),
      typeOfWork: 'vegetable_seller',
    });
    expect(result.success).toBe(true);
  });

  it('rejects business addresses longer than 30 characters', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: '',
      businessAddress: 'C'.repeat(BUSINESS_ADDRESS_MAX_LENGTH + 1),
      typeOfWork: 'vegetable_seller',
    });
    expect(result.success).toBe(false);
  });

  it('includes key Ghanaian occupations in the catalogue', () => {
    const labels = new Set(GHANA_OCCUPATIONS.map((item) => item.label));
    for (const label of [
      'Fresh Fish Seller',
      'Fried Fish Seller',
      'Smoked Fish Seller',
      'Fishmonger',
      'Vegetable Seller',
      'Petty Trader',
      'Mobile Money Vendor',
      'Carpenter',
      'Hairdresser',
      'Farmer',
      'Other — Specify',
    ]) {
      expect(labels.has(label)).toBe(true);
    }
  });

  it('accepts catalogue occupations and resolves labels', () => {
    expect(resolveOccupationLabel('fresh_fish_seller')).toBe('Fresh Fish Seller');
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: 'Stall 18',
      businessAddress: 'Kojokrom Market',
      typeOfWork: 'fresh_fish_seller',
    });
    expect(result.success).toBe(true);
  });

  it('rejects Other — Specify without a custom occupation', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: '',
      businessAddress: 'Market Circle',
      typeOfWork: OTHER_OCCUPATION_VALUE,
      typeOfWorkOther: '',
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === 'typeOfWorkOther')).toBe(true);
  });

  it('accepts Other — Specify with a custom occupation', () => {
    const result = businessStepSchema.safeParse({
      businessName: '',
      businessPremisesNumber: 'Shop A12',
      businessAddress: 'Anaji Main Road',
      typeOfWork: OTHER_OCCUPATION_VALUE,
      typeOfWorkOther: 'Charcoal Seller',
    });
    expect(result.success).toBe(true);
    expect(resolveOccupationLabel(OTHER_OCCUPATION_VALUE, 'Charcoal Seller')).toBe('Charcoal Seller');
  });

  it('preserves legacy free-text occupations', () => {
    expect(resolveOccupationLabel('Trader')).toBe('Trader');
    const result = businessStepSchema.safeParse({
      businessName: 'Shop',
      businessPremisesNumber: '',
      businessAddress: 'Market Road',
      typeOfWork: 'Trader',
    });
    expect(result.success).toBe(true);
  });

  it('accepts exactly 10-digit voter IDs including a leading zero', () => {
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({
        idType: BORROWER_ID_TYPE.VOTER_ID,
        idNumber: '0123456789',
      }),
    );
    expect(result.success).toBe(true);
  });

  it('rejects invalid voter IDs with a field-level message', () => {
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({
        idType: BORROWER_ID_TYPE.VOTER_ID,
        idNumber: 'A123456789',
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === 'idNumber')).toBe(true);
  });

  it('rejects an ID document file that was not persisted', () => {
    const idDocument = new File(['scan'], 'id.jpg', { type: 'image/jpeg' });
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({
        idDocument,
        idDocumentUploadId: undefined,
      }),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((issue) => issue.path[0] === 'idDocument')).toBe(true);
  });

  it('accepts an ID document when the upload id is present', () => {
    const idDocument = new File(['scan'], 'id.jpg', { type: 'image/jpeg' });
    const result = borrowerRegistrationSchema.safeParse(
      createValidRegistration({
        idDocument,
        idDocumentUploadId: 'upload-123',
      }),
    );
    expect(result.success).toBe(true);
  });
});
