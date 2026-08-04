import { isDatabaseEnabled } from '../../db/client.js';
import * as uploadRepository from '../../repositories/upload.repository.js';
import { getUploadProvider } from './index.js';
import { getUploadRecord } from './upload.service.js';

/**
 * Deletes blob storage and soft-deletes metadata when database is enabled.
 */
export async function deleteStoredUpload(id: string): Promise<boolean> {
  const record = await getUploadRecord(id);

  if (!record) {
    return false;
  }

  const providerDeleted = await getUploadProvider().delete(id, record.storageKey, record.mimeType);

  if (isDatabaseEnabled()) {
    await uploadRepository.softDeleteUpload(id);
    return providerDeleted;
  }

  return providerDeleted;
}
