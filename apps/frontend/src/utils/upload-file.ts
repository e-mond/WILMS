import { enqueueUpload } from '@/lib/offline-queue/upload-queue';
import { uploadService } from '@/services';
import type { UploadFileInput, UploadPurpose, UploadRecord } from '@/types/upload';

export interface QueuedUploadResult {
  queued: true;
  id: string;
  url: string;
  fileName: string;
}

export type UploadFileResult = UploadRecord | QueuedUploadResult;

export function isQueuedUpload(result: UploadFileResult): result is QueuedUploadResult {
  return 'queued' in result && result.queued === true;
}

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read file.'));
    };

    reader.onerror = () => reject(new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

export async function uploadFileViaService(input: {
  file: File;
  purpose: UploadPurpose;
  entityId?: string;
}): Promise<UploadRecord> {
  const dataUrl = await fileToDataUrl(input.file);

  const payload: UploadFileInput = {
    purpose: input.purpose,
    fileName: input.file.name,
    mimeType: input.file.type || 'application/octet-stream',
    sizeBytes: input.file.size,
    dataUrl,
    entityId: input.entityId,
  };

  return uploadService.uploadFile(payload);
}

export async function uploadFileWithOfflineQueue(input: {
  file: File;
  purpose: UploadPurpose;
  entityId?: string;
}): Promise<UploadFileResult> {
  if (isBrowserOffline()) {
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(input.file);

    await enqueueUpload({
      id,
      purpose: input.purpose,
      entityId: input.entityId,
      fileName: input.file.name,
      mimeType: input.file.type || 'application/octet-stream',
      blob: input.file,
      createdAt: Date.now(),
      attemptCount: 0,
      lastError: null,
    });

    return {
      queued: true,
      id,
      url: previewUrl,
      fileName: input.file.name,
    };
  }

  return uploadFileViaService(input);
}

export async function deleteUploadedFile(uploadId: string | null | undefined): Promise<void> {
  if (!uploadId) {
    return;
  }

  await uploadService.deleteUpload(uploadId);
}

export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header?.match(/:(.*?);/)?.[1] ?? 'image/png';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

export async function resolveUploadPreviewUrl(
  uploadId: string | null | undefined,
): Promise<string | null> {
  if (!uploadId?.trim()) {
    return null;
  }

  const record = await uploadService.getUpload(uploadId);
  return record?.url ?? null;
}

export async function uploadDataUrlViaService(input: {
  dataUrl: string;
  fileName: string;
  purpose: UploadPurpose;
  entityId?: string;
}): Promise<UploadRecord> {
  const file = dataUrlToFile(input.dataUrl, input.fileName);
  return uploadFileViaService({
    file,
    purpose: input.purpose,
    entityId: input.entityId,
  });
}
