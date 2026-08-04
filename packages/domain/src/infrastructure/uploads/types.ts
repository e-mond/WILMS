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

export interface UploadSaveInput {
  id: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  entityId?: string;
  buffer: Buffer;
}

export interface UploadProviderResult {
  storageKey: string;
  url: string;
  sizeBytes: number;
}

export interface UploadProvider {
  save(input: UploadSaveInput): Promise<UploadProviderResult>;
  delete(id: string, storageKey: string, mimeType?: string): Promise<boolean>;
  readBuffer(storageKey: string, url: string): Promise<Buffer | null>;
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
