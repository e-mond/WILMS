import { resolvePersonPhotoUrl, type PersonPhotoOptions } from '@/utils/person-photo';

export interface EntityPhotoInput extends PersonPhotoOptions {
  photoUrl?: string | null;
}

/** Prefer entity `photoUrl`, then fall back to Dicebear via `resolvePersonPhotoUrl`. */
export function resolveEntityPhotoUrl(input: EntityPhotoInput): string {
  return resolvePersonPhotoUrl({
    name: input.name,
    id: input.id,
    photoFileName: input.photoFileName,
    uploadUrl: input.photoUrl,
  });
}
