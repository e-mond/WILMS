'use client';

import { useEffect } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { compressImageFile } from '@/lib/compression/compress-image';
import { isLowDataModeEnabled } from '@/lib/device/sync-policy';
import {
  listPendingUploads,
  removePendingUpload,
  type PendingUploadRecord,
} from '@/lib/offline-queue/upload-queue';
import { uploadFileViaService } from '@/utils/upload-file';
import { logger } from '@/utils/logger';

async function processUpload(record: PendingUploadRecord): Promise<void> {
  const file = new File([record.blob], record.fileName, {
    type: record.mimeType,
    lastModified: record.createdAt,
  });

  const payload = isLowDataModeEnabled() ? await compressImageFile(file) : file;

  await uploadFileViaService({
    file: payload,
    purpose: record.purpose as import('@/types/upload').UploadPurpose,
    entityId: record.entityId,
  });

  await removePendingUpload(record.id);
}

export function BackgroundUploadProcessor() {
  const { isOnline } = useOfflineStatus();

  useEffect(() => {
    if (!isOnline) {
      return;
    }

    let cancelled = false;

    async function drain() {
      const pending = await listPendingUploads();
      for (const record of pending) {
        if (cancelled) {
          return;
        }

        try {
          await processUpload(record);
        } catch (error) {
          logger.warn('Background upload failed', {
            uploadId: record.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    void drain();
    const intervalId = window.setInterval(() => void drain(), 45_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [isOnline]);

  return null;
}
