import { getUploadConfig, isCloudinaryConfigured } from './config.js';
import { CloudinaryUploadProvider } from './cloudinary-provider.js';
import { LocalUploadProvider } from './local-provider.js';
import type { UploadProvider } from './types.js';

export type { StoredUpload, UploadProvider } from './types.js';
export { toUploadRecord } from './types.js';
export { getUploadConfig, isCloudinaryConfigured } from './config.js';
export { validateUploadInput } from './validation.js';

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

/** @deprecated Use getUploadProvider() — kept for route compatibility */
export const uploadStorage = {
  save: (input: Parameters<UploadProvider['save']>[0]) => getUploadProvider().save(input),
  get: (id: string) => getUploadProvider().get(id),
  delete: (id: string) => getUploadProvider().delete(id),
  readBuffer: (id: string) => getUploadProvider().readBuffer(id),
};
