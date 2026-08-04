import '../config/load-env.js';
import { validateUploadEnvironment } from '../infrastructure/uploads/env-validation.js';
import { isCloudinaryConfigured, getUploadConfig } from '../infrastructure/uploads/config.js';
import { isDatabaseEnabled } from '../db/client.js';

function mask(value: string | undefined): string {
  if (!value) return '(unset)';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

const report = validateUploadEnvironment();
const config = getUploadConfig();

console.log('=== WILMS Upload Environment Certification ===');
console.log(`database: ${isDatabaseEnabled() ? 'enabled' : 'in-memory'}`);
console.log(`requested_provider: ${report.provider}`);
console.log(`active_provider: ${report.activeProvider}`);
console.log(`cloudinary_configured: ${isCloudinaryConfigured()}`);
console.log(`cloud_name: ${mask(config.cloudinary.cloudName)}`);
console.log(`api_key: ${mask(config.cloudinary.apiKey)}`);
console.log(`api_secret: ${mask(config.cloudinary.apiSecret)}`);
console.log(`folder: ${config.cloudinary.folder}`);
console.log(`max_size_bytes: ${config.maxSizeBytes}`);
console.log(`allowed_mime_types: ${config.allowedMimeTypes.join(', ')}`);
console.log(`valid: ${report.valid ? 'PASS' : 'FAIL'}`);

if (report.warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of report.warnings) {
    console.log(`  - ${warning}`);
  }
}

if (report.errors.length > 0) {
  console.log('\nErrors:');
  for (const error of report.errors) {
    console.log(`  - ${error}`);
  }
}

process.exit(report.valid ? 0 : 1);
