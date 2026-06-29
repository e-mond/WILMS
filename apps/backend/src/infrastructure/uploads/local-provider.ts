import { randomUUID } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';
import type { UploadProvider, UploadProviderResult, UploadSaveInput } from './types.js';

const localFiles = new Map<string, string>();

async function ensureUploadDir(): Promise<string> {
  const dir = path.resolve(process.cwd(), env.uploadDir);
  await mkdir(dir, { recursive: true });
  return dir;
}

export class LocalUploadProvider implements UploadProvider {
  async save(input: UploadSaveInput): Promise<UploadProviderResult> {
    const dir = await ensureUploadDir();
    const storagePath = path.join(dir, input.id);
    await writeFile(storagePath, input.buffer);

    localFiles.set(input.id, storagePath);

    return {
      storageKey: storagePath,
      url: `/uploads/${input.id}/content`,
      sizeBytes: input.sizeBytes,
    };
  }

  async delete(id: string, storageKey: string, _mimeType?: string): Promise<boolean> {
    const storagePath = localFiles.get(id) ?? storageKey;

    try {
      await unlink(storagePath);
    } catch {
      // ignore missing file
    }

    localFiles.delete(id);
    return true;
  }

  async readBuffer(storageKey: string, _url?: string): Promise<Buffer | null> {
    try {
      return await readFile(storageKey);
    } catch {
      return null;
    }
  }
}

export function buildLocalUploadId(): string {
  return `upload-${randomUUID()}`;
}
