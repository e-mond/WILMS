import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BORROWER_STATUS } from '../../db/persistence.js';
import type { BorrowerRecord } from '../../db/persistence.js';

vi.mock('../../db/client.js', () => ({
  isDatabaseEnabled: () => false,
  requireDatabase: vi.fn(),
  getDb: () => ({}),
}));

vi.mock('../../infrastructure/notifications/in-app-notify.js', () => ({
  createInAppNotification: vi.fn(async () => undefined),
}));

vi.mock('../../infrastructure/notifications/event-dispatch.js', () => ({
  notifyBorrowerUpdateApproved: vi.fn(async () => undefined),
  notifyBorrowerUpdateRejected: vi.fn(async () => undefined),
}));

function makeBorrower(): BorrowerRecord {
  return {
    id: 'borrower-1',
    fullName: 'Gloria Serwaa',
    phone: '0241111111',
    idType: 'GHANA_CARD',
    idNumber: 'GHA-111',
    status: BORROWER_STATUS.APPROVED,
    hasActiveLoan: true,
    groupName: 'Airport Ridge',
    community: 'Osu',
    registeredAt: new Date().toISOString(),
    registeredByOfficerId: 'officer-1',
    profile: {
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
      houseAddress: '12 High Street',
      gpsAddress: '',
      city: 'Accra',
      region: 'Greater Accra',
      district: 'Accra Metropolitan',
      businessName: 'Shop',
      businessAddress: 'Market Road',
      typeOfWork: 'Retail',
      guarantorName: 'Kojo Mensah',
      guarantorPhone: '0242222222',
      guarantorRelationship: 'Brother',
      photoFileName: 'photo.jpg',
      photoMimeType: 'image/jpeg',
      alternativePhone: '0243333333',
    },
  };
}

describe('borrower update request workflow', () => {
  beforeEach(async () => {
    const { __resetBorrowerUpdateRequestMemoryForTests } = await import(
      '../../modules/borrower-updates/service.js'
    );
    __resetBorrowerUpdateRequestMemoryForTests();
    const persistence = await import('../../db/persistence.js');
    await persistence.saveBorrower(makeBorrower());
  });

  it('creates a submitted request with before and after values', async () => {
    const service = await import('../../modules/borrower-updates/service.js');
    const request = await service.createBorrowerUpdateRequest({
      borrowerId: 'borrower-1',
      field: 'PHONE',
      afterValue: '0244444444',
      reason: 'Number changed',
      requestedByUserId: 'collector-1',
    });

    expect(request.status).toBe('SUBMITTED');
    expect(request.beforeValue).toBe('0241111111');
    expect(request.afterValue).toBe('0244444444');
  });

  it('approves, applies the change, and writes an audit trail', async () => {
    const service = await import('../../modules/borrower-updates/service.js');
    const request = await service.createBorrowerUpdateRequest({
      borrowerId: 'borrower-1',
      field: 'PHONE',
      afterValue: '0244444444',
      reason: 'Number changed',
      requestedByUserId: 'collector-1',
    });

    const approved = await service.approveBorrowerUpdateRequest(request.id, 'officer-1', 'Verified');
    expect(approved.status).toBe('APPROVED');
    expect(approved.appliedAt).toBeTruthy();

    const persistence = await import('../../db/persistence.js');
    const borrower = await persistence.getBorrower('borrower-1');
    expect(borrower?.phone).toBe('0244444444');

    const { notifyBorrowerUpdateApproved } = await import(
      '../../infrastructure/notifications/event-dispatch.js'
    );
    expect(notifyBorrowerUpdateApproved).toHaveBeenCalled();
  });

  it('rejects without changing the borrower record', async () => {
    const service = await import('../../modules/borrower-updates/service.js');
    const request = await service.createBorrowerUpdateRequest({
      borrowerId: 'borrower-1',
      field: 'NAME',
      afterValue: 'Gloria Serwaa Mensah',
      reason: 'Name correction',
      requestedByUserId: 'collector-1',
    });

    const rejected = await service.rejectBorrowerUpdateRequest(request.id, 'officer-1', 'ID mismatch');
    expect(rejected.status).toBe('REJECTED');

    const persistence = await import('../../db/persistence.js');
    const borrower = await persistence.getBorrower('borrower-1');
    expect(borrower?.fullName).toBe('Gloria Serwaa');

    const { notifyBorrowerUpdateRejected } = await import(
      '../../infrastructure/notifications/event-dispatch.js'
    );
    expect(notifyBorrowerUpdateRejected).toHaveBeenCalled();
  });

  it('blocks the requester from approving their own request', async () => {
    const service = await import('../../modules/borrower-updates/service.js');
    const request = await service.createBorrowerUpdateRequest({
      borrowerId: 'borrower-1',
      field: 'ADDRESS',
      afterValue: '15 High Street',
      reason: 'Moved house',
      requestedByUserId: 'collector-1',
    });

    await expect(service.approveBorrowerUpdateRequest(request.id, 'collector-1')).rejects.toThrow(
      /cannot approve/i,
    );
  });
});
