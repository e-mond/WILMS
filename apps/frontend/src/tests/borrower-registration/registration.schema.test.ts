import { describe, expect, it } from 'vitest';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import { borrowerRegistrationSchema } from '@/features/borrower-registration/registration.schema';

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
    businessAddress: 'Madina Market Stall 4',
    typeOfWork: 'Trader',
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

  it('rejects non-image photo uploads', () => {
    const photo = new File(['text'], 'notes.txt', { type: 'text/plain' });
    const result = borrowerRegistrationSchema.safeParse(createValidRegistration({ photo }));

    expect(result.success).toBe(false);
  });
});
