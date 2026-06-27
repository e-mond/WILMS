/**
 * P14.5A — RC-051: Cloudinary upload lifecycle smoke (when credentials present).
 *
 * Usage: npm run cert:upload:smoke -w @wilms/api
 */
import '../config/load-env.js';
import { randomUUID } from 'node:crypto';
import { isCloudinaryConfigured, validateUploadEnvironment } from '../infrastructure/uploads/index.js';
import { saveUpload } from '../infrastructure/uploads/upload.service.js';
import { deleteStoredUpload } from '../infrastructure/uploads/delete-upload.js';
import { isDatabaseEnabled } from '../db/client.js';

async function main(): Promise<void> {
  console.log('=== WILMS Upload Smoke Certification ===');

  const envReport = validateUploadEnvironment();
  console.log(`valid: ${envReport.valid ? 'PASS' : 'FAIL'}`);
  console.log(`active_provider: ${envReport.activeProvider}`);

  if (!isDatabaseEnabled()) {
    console.error('FAIL — DATABASE_URL required for upload metadata persistence');
    process.exit(1);
  }

  if (!isCloudinaryConfigured() || envReport.activeProvider !== 'cloudinary') {
    console.log('SKIP — Cloudinary credentials not configured (RC-051 remains open)');
    console.log('Set UPLOAD_PROVIDER=cloudinary and CLOUDINARY_* to run smoke test');
    process.exit(0);
  }

  const buffer = Buffer.from('P14.5A upload smoke test');
  const stored = await saveUpload({
    purpose: 'document',
    fileName: `smoke-${randomUUID()}.txt`,
    mimeType: 'application/pdf',
    sizeBytes: buffer.length,
    entityId: 'cert-smoke',
    buffer,
  });

  console.log(`upload_id: ${stored.id}`);
  console.log(`storage_key: ${stored.storageKey}`);

  await deleteStoredUpload(stored.id);
  console.log('delete: PASS');
  console.log('cert:upload:smoke PASS');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
