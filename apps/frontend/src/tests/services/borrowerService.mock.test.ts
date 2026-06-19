import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BORROWER_GENDER, BORROWER_ID_TYPE } from '@/constants/borrower-registration';
import { API_ERROR_CODE } from '@/types/api';
import borrowerServiceMock, {
  resetMockBorrowerRegistrations,
} from '@/services/mock/borrowerService.mock';

const basePayload = {
  registeredByOfficerId: 'user-officer',
  fullName: 'New Borrower',
  dateOfBirth: '1990-01-01',
  gender: BORROWER_GENDER.FEMALE,
  phone: '+233244999001',
  nationality: 'Ghanaian',
  idType: BORROWER_ID_TYPE.PASSPORT,
  idNumber: 'P9999999',
  houseAddress: '12 High Street',
  gpsAddress: 'GA-123-4567',
  city: 'Accra',
  region: 'Greater Accra',
  district: 'Ayawaso',
  businessName: 'Fresh Foods',
  businessAddress: 'Market Road',
  typeOfWork: 'Trading',
  guarantorName: 'Kofi Aidoo',
  guarantorPhone: '+233244111333',
  guarantorRelationship: 'Friend',
  photoFileName: 'photo.jpg',
  photoMimeType: 'image/jpeg',
};

describe('borrowerService.mock conflict checks', () => {
  beforeEach(() => {
    resetMockBorrowerRegistrations();
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('generated-borrower-id');
  });

  it('detects duplicate phone numbers', async () => {
    const result = await borrowerServiceMock.checkPhone('+233241234567');

    expect(result).toEqual({
      isDuplicate: true,
      existingBorrowerId: 'borrower-001',
      existingBorrowerName: 'Ama Mensah',
    });
  });

  it('detects duplicate ID numbers for the same type', async () => {
    const result = await borrowerServiceMock.checkId(
      BORROWER_ID_TYPE.GHANA_CARD,
      'GHA-123456789-0',
    );

    expect(result).toEqual({
      isDuplicate: true,
      existingBorrowerId: 'borrower-001',
      existingBorrowerName: 'Ama Mensah',
    });
  });

  it('returns fuzzy name matches within distance two', async () => {
    const result = await borrowerServiceMock.checkName('Ama Mensan');

    expect(result.matches).toEqual([
      expect.objectContaining({
        borrowerId: 'borrower-001',
        fullName: 'Ama Mensah',
        distance: 1,
      }),
    ]);
  });

  it('blocks borrowers with active loans', async () => {
    const result = await borrowerServiceMock.checkActiveLoan('+233241234567');

    expect(result).toEqual({
      hasActiveLoan: true,
      existingBorrowerId: 'borrower-001',
      existingBorrowerName: 'Ama Mensah',
    });
  });

  it('blocks blacklisted borrowers by phone or ID', async () => {
    const phoneResult = await borrowerServiceMock.checkBlacklist({
      fullName: 'Yaa Darko',
      phone: '+233551234567',
      idType: BORROWER_ID_TYPE.GHANA_CARD,
      idNumber: 'GHA-000000000-0',
    });

    const idResult = await borrowerServiceMock.checkBlacklist({
      fullName: 'Yaa Darko',
      phone: '+233500000000',
      idType: BORROWER_ID_TYPE.GHANA_CARD,
      idNumber: 'GHA-555555555-5',
    });

    expect(phoneResult.isBlacklisted).toBe(true);
    expect(idResult.isBlacklisted).toBe(true);
  });

  it('rejects registration when blocking conflicts exist', async () => {
    await expect(
      borrowerServiceMock.registerBorrower({
        ...basePayload,
        phone: '+233241234567',
      }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });

  it('registers a borrower when no blocking conflicts exist', async () => {
    const result = await borrowerServiceMock.registerBorrower(basePayload);

    expect(result).toMatchObject({
      id: 'generated-borrower-id',
      fullName: 'New Borrower',
      phone: '+233244999001',
    });
  });

  it('returns a full borrower review profile', async () => {
    const review = await borrowerServiceMock.getBorrowerReview('borrower-pending-001');

    expect(review).toMatchObject({
      fullName: 'Adjoa Owusu',
      status: 'PENDING',
      businessName: 'Adjoa Provisions',
      registeredByOfficerName: 'Registration Officer',
      photoFileName: 'adjoa-passport.jpg',
    });
  });

  it('approves a pending borrower', async () => {
    const result = await borrowerServiceMock.approveBorrower('borrower-pending-001');

    expect(result.status).toBe('APPROVED');
    await expect(borrowerServiceMock.approveBorrower('borrower-pending-001')).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });
  });

  it('rejects a pending borrower with a reason', async () => {
    await expect(
      borrowerServiceMock.rejectBorrower('borrower-pending-002', { reason: '' }),
    ).rejects.toMatchObject({
      code: API_ERROR_CODE.VALIDATION,
    });

    const result = await borrowerServiceMock.rejectBorrower('borrower-pending-002', {
      reason: 'Incomplete documents',
    });

    expect(result.status).toBe('REJECTED');
  });

  it('blacklists a pending borrower with a reason', async () => {
    const result = await borrowerServiceMock.blacklistBorrower('borrower-pending-001', {
      reason: 'Fraud concern',
    });

    expect(result.status).toBe('BLACKLISTED');
  });

  it('lists pending applications for the approval queue', async () => {
    const applications = await borrowerServiceMock.listPendingApplications();

    expect(applications).toEqual([
      expect.objectContaining({
        id: 'borrower-pending-002',
        fullName: 'Kwame Asante',
        registeredByOfficerName: 'Registration Officer',
      }),
      expect.objectContaining({
        id: 'borrower-pending-001',
        fullName: 'Adjoa Owusu',
        registeredByOfficerName: 'Registration Officer',
      }),
    ]);
    expect(applications.some((application) => application.fullName === 'Ama Mensah')).toBe(false);
  });

  it('lists registrations for a specific officer', async () => {
    const registrations = await borrowerServiceMock.listMyRegistrations('user-officer');

    expect(registrations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fullName: 'Ama Mensah', status: 'APPROVED' }),
        expect.objectContaining({ fullName: 'Adjoa Owusu', status: 'PENDING' }),
      ]),
    );
    expect(registrations.some((registration) => registration.fullName === 'Ama Mensan')).toBe(false);
  });
});
