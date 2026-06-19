import type { UploadRecord } from '@/types/upload';

const uploads = new Map<string, UploadRecord>();

export function saveUploadRecord(record: UploadRecord): UploadRecord {
  uploads.set(record.id, { ...record });
  return { ...record };
}

export function getUploadRecord(id: string): UploadRecord | undefined {
  const record = uploads.get(id);
  return record ? { ...record } : undefined;
}

export function deleteUploadRecord(id: string): boolean {
  return uploads.delete(id);
}

export function resetUploadStore(): void {
  uploads.clear();
}
