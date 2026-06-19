import { beforeEach, describe, expect, it } from 'vitest';
import { UPLOAD_PURPOSE } from '@/types/upload';
import uploadServiceMock from '@/services/mock/uploadService.mock';
import { resetUploadStore } from '@/services/mock/upload.store';

describe('uploadService.mock', () => {
  beforeEach(() => {
    resetUploadStore();
  });

  it('stores profile photo uploads and returns a retrievable record', async () => {
    const record = await uploadServiceMock.uploadFile({
      purpose: UPLOAD_PURPOSE.PROFILE_PHOTO,
      fileName: 'profile.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2048,
      dataUrl: 'data:image/jpeg;base64,abc',
      entityId: 'user-super-admin',
    });

    expect(record.id).toMatch(/^upl_/);
    expect(record.purpose).toBe(UPLOAD_PURPOSE.PROFILE_PHOTO);
    expect(record.url).toBe('data:image/jpeg;base64,abc');

    const fetched = await uploadServiceMock.getUpload(record.id);
    expect(fetched?.fileName).toBe('profile.jpg');
  });

  it('supports borrower, guarantor, document, and registration attachment purposes', async () => {
    const purposes = [
      UPLOAD_PURPOSE.BORROWER_PHOTO,
      UPLOAD_PURPOSE.GUARANTOR_PHOTO,
      UPLOAD_PURPOSE.DOCUMENT,
      UPLOAD_PURPOSE.REGISTRATION_ATTACHMENT,
    ] as const;

    for (const purpose of purposes) {
      const record = await uploadServiceMock.uploadFile({
        purpose,
        fileName: `${purpose}.png`,
        mimeType: 'image/png',
        sizeBytes: 512,
      });

      expect(record.purpose).toBe(purpose);
    }
  });

  it('rejects zero-byte uploads and missing records on delete', async () => {
    await expect(
      uploadServiceMock.uploadFile({
        purpose: UPLOAD_PURPOSE.DOCUMENT,
        fileName: 'empty.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 0,
      }),
    ).rejects.toThrow('Upload file size must be greater than zero.');

    await expect(uploadServiceMock.deleteUpload('missing-upload')).rejects.toThrow(
      'Upload not found.',
    );
  });
});
