import { API_BASE_URL } from '@/config/api';
import { resolvePersonPhotoUrl, type PersonPhotoOptions } from '@/utils/person-photo';

export interface EntityPhotoInput extends PersonPhotoOptions {
  photoUrl?: string | null;
}

function resolveUploadUrl(uploadUrl?: string | null): string | undefined {
  const trimmed = uploadUrl?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (API_BASE_URL) {
    return `${API_BASE_URL}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
  }

  return trimmed;
}

/** Prefer entity `photoUrl`, then fall back to Dicebear via `resolvePersonPhotoUrl`. */
export function resolveEntityPhotoUrl(input: EntityPhotoInput): string {
  return resolvePersonPhotoUrl({
    name: input.name,
    id: input.id,
    photoFileName: input.photoFileName,
    uploadUrl: resolveUploadUrl(input.photoUrl),
  });
}
