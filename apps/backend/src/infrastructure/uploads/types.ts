export interface StoredUpload {
  id: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
  entityId?: string;
  uploadedAt: string;
  storageKey: string;
}

export interface UploadProvider {
  save(input: {
    purpose: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    entityId?: string;
    buffer: Buffer;
  }): Promise<StoredUpload>;
  get(id: string): Promise<StoredUpload | null>;
  delete(id: string): Promise<boolean>;
  readBuffer(id: string): Promise<Buffer | null>;
  getSignedUploadParams?(): Promise<{
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  }>;
}

export function toUploadRecord(stored: StoredUpload) {
  return {
    id: stored.id,
    purpose: stored.purpose,
    fileName: stored.fileName,
    mimeType: stored.mimeType,
    sizeBytes: stored.sizeBytes,
    url: stored.url,
    entityId: stored.entityId,
    uploadedAt: stored.uploadedAt,
  };
}
