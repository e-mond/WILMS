const DICEBEAR_BASE = 'https://api.dicebear.com/7.x/personas/svg';

export interface PersonPhotoOptions {
  name: string;
  id?: string;
  photoFileName?: string | null;
  /** Resolved upload URL from IUploadService when available. */
  uploadUrl?: string | null;
}

export function resolvePersonPhotoUrl({
  name,
  id,
  photoFileName,
  uploadUrl,
}: PersonPhotoOptions): string {
  if (uploadUrl?.trim()) {
    return uploadUrl;
  }

  const seed = encodeURIComponent(photoFileName ?? id ?? name);
  return `${DICEBEAR_BASE}?seed=${seed}&backgroundColor=e8f5f0,f0f4f8&backgroundType=gradientLinear`;
}
