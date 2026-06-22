import { getUploadConfig, isCloudinaryConfigured } from './config.js';
import { CloudinaryUploadProvider } from './cloudinary-provider.js';
import { LocalUploadProvider } from './local-provider.js';
import type { UploadProvider } from './types.js';

export type { StoredUpload, UploadProvider } from './types.js';
export { toUploadRecord } from './types.js';
export { getUploadConfig, isCloudinaryConfigured } from './config.js';
export { validateUploadInput } from './validation.js';
export { validateUploadEnvironment } from './env-validation.js';
export {
  buildCloudinaryTransformUrl,
  transformStoredUploadUrl,
  resolveTransformPresetForPurpose,
  CLOUDINARY_TRANSFORM_PRESET,
} from './cloudinary-transform.js';
export {
  saveUpload,
  getUploadRecord,
  readUploadBuffer,
  resolveUploadAccessUrl,
  resolveUploadAccessUrlById,
} from './upload.service.js';
export { deleteStoredUpload } from './delete-upload.js';

let providerInstance: UploadProvider | null = null;

export function getUploadProvider(): UploadProvider {
  if (providerInstance) {
    return providerInstance;
  }

  const config = getUploadConfig();

  if (config.provider === 'cloudinary' && isCloudinaryConfigured()) {
    providerInstance = new CloudinaryUploadProvider();
    return providerInstance;
  }

  providerInstance = new LocalUploadProvider();
  return providerInstance;
}

/** @deprecated Use upload service helpers — kept for route compatibility during migration */
export const uploadStorage = {
  save: async (input: {
    purpose: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    entityId?: string;
    buffer: Buffer;
  }) => {
    const { saveUpload } = await import('./upload.service.js');
    return saveUpload(input);
  },
  get: async (id: string) => {
    const { getUploadRecord } = await import('./upload.service.js');
    return getUploadRecord(id);
  },
  delete: async (id: string) => {
    const { deleteStoredUpload } = await import('./delete-upload.js');
    return deleteStoredUpload(id);
  },
  readBuffer: async (id: string) => {
    const { readUploadBuffer } = await import('./upload.service.js');
    return readUploadBuffer(id);
  },
};
