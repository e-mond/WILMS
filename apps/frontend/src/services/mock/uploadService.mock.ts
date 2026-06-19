import type { UploadFileInput, UploadRecord } from '@/types/upload';
import type { IUploadService } from '@/types/services';
import { simulateDelay } from '@/services/mock/delay';
import {
  deleteUploadRecord,
  getUploadRecord,
  saveUploadRecord,
} from '@/services/mock/upload.store';

function buildUploadId(): string {
  return `upl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function resolveUploadUrl(input: UploadFileInput, id: string): string {
  if (input.dataUrl?.startsWith('data:')) {
    return input.dataUrl;
  }

  return `/uploads/${input.purpose}/${id}/${encodeURIComponent(input.fileName)}`;
}

const uploadServiceMock: IUploadService = {
  async uploadFile(input: UploadFileInput): Promise<UploadRecord> {
    await simulateDelay();

    if (input.sizeBytes <= 0) {
      throw new Error('Upload file size must be greater than zero.');
    }

    const id = buildUploadId();
    const record: UploadRecord = {
      id,
      purpose: input.purpose,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      url: resolveUploadUrl(input, id),
      entityId: input.entityId,
      uploadedAt: new Date().toISOString(),
    };

    return saveUploadRecord(record);
  },

  async getUpload(id: string): Promise<UploadRecord | null> {
    await simulateDelay();
    return getUploadRecord(id) ?? null;
  },

  async deleteUpload(id: string): Promise<void> {
    await simulateDelay();

    if (!deleteUploadRecord(id)) {
      throw new Error('Upload not found.');
    }
  },
};

export default uploadServiceMock;
