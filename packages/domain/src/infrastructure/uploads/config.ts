export type UploadProviderName = 'local' | 'cloudinary';

export interface UploadConfig {
  provider: UploadProviderName;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    folder: string;
  };
}

function parseMimeList(value: string | undefined): string[] {
  if (!value?.trim()) {
    return ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function getUploadConfig(): UploadConfig {
  const provider = (process.env.UPLOAD_PROVIDER ?? 'local').toLowerCase() as UploadProviderName;

  return {
    provider: provider === 'cloudinary' ? 'cloudinary' : 'local',
    maxSizeBytes: Number(process.env.UPLOAD_MAX_SIZE_BYTES ?? 10 * 1024 * 1024),
    allowedMimeTypes: parseMimeList(process.env.UPLOAD_ALLOWED_MIME_TYPES),
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? '',
      apiKey: process.env.CLOUDINARY_API_KEY?.trim() ?? '',
      apiSecret: process.env.CLOUDINARY_API_SECRET?.trim() ?? '',
      folder: process.env.CLOUDINARY_FOLDER?.trim() || 'wilms',
    },
  };
}

export function isCloudinaryConfigured(config: UploadConfig = getUploadConfig()): boolean {
  return Boolean(
    config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret,
  );
}
