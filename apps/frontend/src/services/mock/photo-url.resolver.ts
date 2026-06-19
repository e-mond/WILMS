import { resolvePersonPhotoUrl } from '@/utils/person-photo';
import { getUploadRecord } from '@/services/mock/upload.store';

export interface MockPhotoResolveInput {
  name: string;
  id?: string;
  photoFileName?: string | null;
  photoUploadId?: string | null;
  photoUrl?: string | null;
}

export function resolveMockPhotoUrl(input: MockPhotoResolveInput): string {
  if (input.photoUrl?.trim()) {
    return input.photoUrl;
  }

  if (input.photoUploadId) {
    const record = getUploadRecord(input.photoUploadId);
    if (record?.url) {
      return record.url;
    }
  }

  return resolvePersonPhotoUrl({
    name: input.name,
    id: input.id,
    photoFileName: input.photoFileName,
  });
}
