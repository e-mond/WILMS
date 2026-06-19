import { beforeEach, describe, expect, it } from 'vitest';
import { UPLOAD_PURPOSE } from '@/types/upload';
import { uploadFileViaService } from '@/utils/upload-file';
import uploadServiceMock from '@/services/mock/uploadService.mock';
import { resetUploadStore } from '@/services/mock/upload.store';

describe('upload-file utils', () => {
  beforeEach(() => {
    resetUploadStore();
  });

  it('uploads files through the upload service', async () => {
    const file = new File(['hello'], 'receipt.png', { type: 'image/png' });
    const record = await uploadFileViaService({
      file,
      purpose: UPLOAD_PURPOSE.DOCUMENT,
      entityId: 'expense-1',
    });

    expect(record.purpose).toBe(UPLOAD_PURPOSE.DOCUMENT);
    expect(record.url).toContain('data:');

    const fetched = await uploadServiceMock.getUpload(record.id);
    expect(fetched?.fileName).toBe('receipt.png');
  });
});
