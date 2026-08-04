import { getUploadConfig, isCloudinaryConfigured } from './config.js';

export interface UploadEnvironmentReport {
  provider: 'local' | 'cloudinary';
  activeProvider: 'local' | 'cloudinary';
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates upload configuration without logging secret values.
 */
export function validateUploadEnvironment(): UploadEnvironmentReport {
  const config = getUploadConfig();
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const warnings: string[] = [];
  const errors: string[] = [];

  const requestedCloudinary = config.provider === 'cloudinary';
  const cloudinaryReady = isCloudinaryConfigured(config);

  let activeProvider: 'local' | 'cloudinary' = 'local';

  if (requestedCloudinary) {
    if (!cloudinaryReady) {
      const missing: string[] = [];
      if (!config.cloudinary.cloudName) missing.push('CLOUDINARY_CLOUD_NAME');
      if (!config.cloudinary.apiKey) missing.push('CLOUDINARY_API_KEY');
      if (!config.cloudinary.apiSecret) missing.push('CLOUDINARY_API_SECRET');

      if (nodeEnv === 'production') {
        errors.push(
          `UPLOAD_PROVIDER=cloudinary but missing: ${missing.join(', ')}`,
        );
      } else {
        warnings.push(
          `UPLOAD_PROVIDER=cloudinary but missing ${missing.join(', ')} — falling back to local storage`,
        );
      }
    } else {
      activeProvider = 'cloudinary';
    }
  }

  if (nodeEnv === 'production' && !requestedCloudinary) {
    warnings.push('Production is using UPLOAD_PROVIDER=local — Cloudinary recommended for production');
  }

  if (config.maxSizeBytes <= 0) {
    errors.push('UPLOAD_MAX_SIZE_BYTES must be a positive integer');
  }

  if (config.allowedMimeTypes.length === 0) {
    errors.push('UPLOAD_ALLOWED_MIME_TYPES must include at least one MIME type');
  }

  return {
    provider: config.provider,
    activeProvider,
    valid: errors.length === 0,
    warnings,
    errors,
  };
}
