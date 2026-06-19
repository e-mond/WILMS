import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import type { StoredUpload, UploadProvider } from './types.js';

const uploads = new Map<string, StoredUpload & { storagePath: string }>();

async function ensureUploadDir(): Promise<string> {
  const dir = path.resolve(process.cwd(), env.uploadDir);
  await mkdir(dir, { recursive: true });
  return dir;
}

export class LocalUploadProvider implements UploadProvider {
  async save(input: {
    purpose: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    entityId?: string;
    buffer: Buffer;
  }): Promise<StoredUpload> {
    const id = `upload-${randomUUID()}`;
    const dir = await ensureUploadDir();
    const storagePath = path.join(dir, id);
    await writeFile(storagePath, input.buffer);

    const record: StoredUpload & { storagePath: string } = {
      id,
      purpose: input.purpose,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      entityId: input.entityId,
      uploadedAt: new Date().toISOString(),
      storageKey: storagePath,
      storagePath,
      url: `/uploads/${id}/content`,
    };

    uploads.set(id, record);
    return record;
  }

  async get(id: string): Promise<StoredUpload | null> {
    const record = uploads.get(id);
    if (!record) {
      return null;
    }

    const { storagePath: _storagePath, ...rest } = record;
    return rest;
  }

  async delete(id: string): Promise<boolean> {
    const record = uploads.get(id);

    if (!record) {
      return false;
    }

    try {
      await unlink(record.storagePath);
    } catch {
      // ignore missing file
    }

    uploads.delete(id);
    return true;
  }

  async readBuffer(id: string): Promise<Buffer | null> {
    const record = uploads.get(id);

    if (!record) {
      return null;
    }

    return readFile(record.storagePath);
  }
}
