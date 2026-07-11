import { describe, expect, it } from 'vitest';
import { normalizeDraftFormValues, reviewDetailToFormValues } from '@/features/borrower-registration/registration.utils';
import { resolveMediaPreviewUrl } from '@/utils/media-preview';

describe('media-preview', () => {
  it('returns string URLs unchanged', () => {
    expect(resolveMediaPreviewUrl('https://example.com/photo.jpg')).toBe('https://example.com/photo.jpg');
  });

  it('returns null for empty files and invalid values', () => {
    expect(resolveMediaPreviewUrl(null)).toBeNull();
    expect(resolveMediaPreviewUrl(new File([], 'empty.jpg'))).toBeNull();
    expect(resolveMediaPreviewUrl({})).toBeNull();
  });
});

describe('registration edit helpers', () => {
  it('maps review detail to preview URLs instead of placeholder files', () => {
    const values = reviewDetailToFormValues({
      id: 'borrower-1',
      fullName: 'Ama Mensah',
      phone: '0240000001',
      status: 'PENDING',
      groupName: '',
      groupId: 'group-1',
      nationalId: 'GHA-123',
      community: 'Accra',
      registeredAt: '2026-01-01T00:00:00.000Z',
      dateOfBirth: '1990-01-01',
      gender: 'FEMALE',
      nationality: 'Ghanaian',
      idType: 'GHANA_CARD',
      idNumber: 'GHA-123456789-1',
      houseAddress: '12 High St',
      gpsAddress: 'GA-001',
      city: 'Accra',
      region: 'Greater Accra',
      district: 'Accra Metro',
      businessName: 'Ama Shop',
      businessAddress: 'Market Rd',
      typeOfWork: 'Trading',
      guarantorName: 'Kofi Mensah',
      guarantorPhone: '0240000002',
      guarantorRelationship: 'Brother',
      photoFileName: 'photo.jpg',
      photoMimeType: 'image/jpeg',
      photoUrl: 'https://cdn.example.com/photo.jpg',
      guarantorPhotoUrl: 'https://cdn.example.com/guarantor.jpg',
      registeredByOfficerName: 'Officer One',
    });

    expect(values.photo).toBeNull();
    expect(values.guarantorPhoto).toBeNull();
    expect(values.photoPreviewUrl).toBe('https://cdn.example.com/photo.jpg');
    expect(values.guarantorPreviewUrl).toBe('https://cdn.example.com/guarantor.jpg');
  });

  it('strips invalid file objects from draft payloads', () => {
    const values = normalizeDraftFormValues({
      fullName: 'Draft User',
      photo: { name: 'photo.jpg', size: 0 },
      guarantorPhoto: 'https://cdn.example.com/g.jpg',
    });

    expect(values.fullName).toBe('Draft User');
    expect(values.photo).toBeNull();
    expect(values.guarantorPhoto).toBeNull();
  });
});
