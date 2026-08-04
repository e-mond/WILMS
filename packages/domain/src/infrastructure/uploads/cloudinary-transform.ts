import { v2 as cloudinary } from 'cloudinary';
import { getUploadConfig, isCloudinaryConfigured } from './config.js';

export const CLOUDINARY_TRANSFORM_PRESET = {
  PROFILE_THUMB: 'profile-thumb',
  BORROWER_PHOTO: 'borrower-photo',
  DOCUMENT_PREVIEW: 'document-preview',
  ORIGINAL: 'original',
} as const;

export type CloudinaryTransformPreset =
  (typeof CLOUDINARY_TRANSFORM_PRESET)[keyof typeof CLOUDINARY_TRANSFORM_PRESET];

const PRESET_TRANSFORMS: Record<
  CloudinaryTransformPreset,
  Array<Record<string, string | number>>
> = {
  [CLOUDINARY_TRANSFORM_PRESET.ORIGINAL]: [],
  [CLOUDINARY_TRANSFORM_PRESET.PROFILE_THUMB]: [
    { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
  ],
  [CLOUDINARY_TRANSFORM_PRESET.BORROWER_PHOTO]: [
    { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto', fetch_format: 'auto' },
  ],
  [CLOUDINARY_TRANSFORM_PRESET.DOCUMENT_PREVIEW]: [
    { width: 1200, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
  ],
};

function ensureCloudinaryConfigured(): void {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured.');
  }

  const config = getUploadConfig();
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
  });
}

/**
 * Builds a Cloudinary delivery URL for a stored public_id.
 */
export function buildCloudinaryTransformUrl(
  publicId: string,
  preset: CloudinaryTransformPreset = CLOUDINARY_TRANSFORM_PRESET.ORIGINAL,
): string {
  ensureCloudinaryConfigured();

  return cloudinary.url(publicId, {
    secure: true,
    transformation: PRESET_TRANSFORMS[preset],
  });
}

/**
 * Applies a transform preset to an existing secure_url when public_id is known.
 */
export function transformStoredUploadUrl(
  storageKey: string,
  preset: CloudinaryTransformPreset,
): string {
  return buildCloudinaryTransformUrl(storageKey, preset);
}

export function resolveTransformPresetForPurpose(purpose: string): CloudinaryTransformPreset {
  switch (purpose) {
    case 'profile-photo':
      return CLOUDINARY_TRANSFORM_PRESET.PROFILE_THUMB;
    case 'borrower-photo':
    case 'guarantor-photo':
      return CLOUDINARY_TRANSFORM_PRESET.BORROWER_PHOTO;
    case 'document':
    case 'registration-attachment':
      return CLOUDINARY_TRANSFORM_PRESET.DOCUMENT_PREVIEW;
    default:
      return CLOUDINARY_TRANSFORM_PRESET.ORIGINAL;
  }
}

/** Cloudinary destroy/upload_stream require an explicit resource type (not `auto`). */
export function resolveCloudinaryResourceType(mimeType: string): 'image' | 'raw' | 'video' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  return 'raw';
}
