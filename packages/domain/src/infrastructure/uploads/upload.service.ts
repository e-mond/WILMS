import { uuidv7 } from 'uuidv7';
import { isDatabaseEnabled } from '../../db/client.js';
import * as uploadRepository from '../../repositories/upload.repository.js';
import { getUploadConfig, isCloudinaryConfigured } from './config.js';
import { buildLocalUploadId } from './local-provider.js';
import { getUploadProvider } from './index.js';
import type { StoredUpload } from './types.js';
import { toUploadRecord } from './types.js';

const memoryUploads = new Map<string, StoredUpload>();

function isCloudinaryUrl(url: string): boolean {
  return url.startsWith('https://res.cloudinary.com/');
}

function createUploadId(): string {
  if (isDatabaseEnabled()) {
    return uuidv7();
  }

  const config = getUploadConfig();
  if (config.provider === 'cloudinary' && isCloudinaryConfigured()) {
    return uuidv7();
  }

  return buildLocalUploadId();
}

async function persistUploadRecord(
  record: StoredUpload,
  ownerUserId?: string,
): Promise<StoredUpload> {
  if (isDatabaseEnabled()) {
    return uploadRepository.insertUpload({ ...record, ownerUserId });
  }

  memoryUploads.set(record.id, record);
  return record;
}

export async function saveUpload(input: {
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  entityId?: string;
  buffer: Buffer;
  ownerUserId?: string;
}): Promise<StoredUpload> {
  const id = createUploadId();
  const providerResult = await getUploadProvider().save({
    id,
    purpose: input.purpose,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    entityId: input.entityId,
    buffer: input.buffer,
  });

  const record: StoredUpload = {
    id,
    purpose: input.purpose,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: providerResult.sizeBytes,
    entityId: input.entityId,
    uploadedAt: new Date().toISOString(),
    storageKey: providerResult.storageKey,
    url: providerResult.url,
  };

  return persistUploadRecord(record, input.ownerUserId);
}

export async function getUploadRecord(id: string): Promise<StoredUpload | null> {
  if (isDatabaseEnabled()) {
    const row = await uploadRepository.findUploadById(id);
    if (row) {
      return row;
    }
  }

  return memoryUploads.get(id) ?? null;
}

export async function readUploadBuffer(id: string): Promise<Buffer | null> {
  const record = await getUploadRecord(id);
  if (!record) {
    return null;
  }

  return getUploadProvider().readBuffer(record.storageKey, record.url);
}

/**
 * Public URL for clients — Cloudinary CDN when stored remotely, API proxy for local disk.
 */
export function resolveUploadAccessUrl(record: StoredUpload | null | undefined): string | undefined {
  if (!record) {
    return undefined;
  }

  if (isCloudinaryUrl(record.url)) {
    return record.url;
  }

  return `/uploads/${record.id}/content`;
}

export async function resolveUploadAccessUrlById(
  uploadId: string | null | undefined,
): Promise<string | undefined> {
  if (!uploadId) {
    return undefined;
  }

  const record = await getUploadRecord(uploadId);
  return resolveUploadAccessUrl(record);
}

export { toUploadRecord };
