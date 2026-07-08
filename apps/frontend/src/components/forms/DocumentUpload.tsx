'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import type { UploadPurpose, UploadRecord } from '@/types/upload';
import {
  deleteUploadedFile,
  isQueuedUpload,
  uploadFileWithOfflineQueue,
} from '@/utils/upload-file';
import { cn } from '@/utils/cn';

const DEFAULT_ACCEPT = 'image/*,application/pdf';

export interface DocumentUploadProps {
  id: string;
  label: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  hasError?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  accept?: string;
  uploadPurpose?: UploadPurpose;
  entityId?: string;
  onUploadRecordChange?: (record: UploadRecord | null) => void;
}

function isPreviewableImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function DocumentUpload({
  id,
  label,
  value = null,
  onChange,
  onBlur,
  hasError = false,
  error,
  disabled = false,
  className,
  accept = DEFAULT_ACCEPT,
  uploadPurpose,
  entityId,
  onUploadRecordChange,
}: DocumentUploadProps) {
  const helperId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadRecord, setUploadRecord] = useState<UploadRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!value) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    if (isPreviewableImage(value.type)) {
      const objectUrl = URL.createObjectURL(value);
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = objectUrl;
      setPreviewUrl(objectUrl);
      return () => {
        if (blobUrlRef.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          blobUrlRef.current = null;
        }
      };
    }

    setPreviewUrl(uploadRecord?.url ?? null);
  }, [value, uploadRecord?.url]);

  const displayError = error ?? localError;
  const showError = hasError || Boolean(displayError);

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setLocalError(null);
      onChange(null);
      onBlur?.();
      return;
    }

    if (file.size <= 0) {
      setLocalError('File must not be empty.');
      onChange(null);
      onBlur?.();
      return;
    }

    setLocalError(null);
    onChange(file);
    onBlur?.();

    if (!uploadPurpose) {
      return;
    }

    setIsUploading(true);

    try {
      if (uploadRecord?.id) {
        await deleteUploadedFile(uploadRecord.id);
      }

      const result = await uploadFileWithOfflineQueue({
        file,
        purpose: uploadPurpose,
        entityId,
      });

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      if (isQueuedUpload(result)) {
        const queuedRecord = {
          id: result.id,
          url: result.url,
          fileName: result.fileName,
          purpose: uploadPurpose,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          uploadedAt: new Date().toISOString(),
        };
        setUploadRecord(queuedRecord);
        if (isPreviewableImage(file.type)) {
          setPreviewUrl(result.url);
        }
        onUploadRecordChange?.(queuedRecord);
        return;
      }

      setUploadRecord(result);
      if (isPreviewableImage(file.type)) {
        setPreviewUrl(result.url);
      }
      onUploadRecordChange?.(result);
    } catch {
      setLocalError('Unable to upload document. Try again.');
      setUploadRecord(null);
      onUploadRecordChange?.(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void handleFileSelection(event.target.files?.[0] ?? null);
    event.target.value = '';
  };

  const handleRemove = async () => {
    setLocalError(null);
    onChange(null);
    onBlur?.();

    if (uploadRecord?.id) {
      await deleteUploadedFile(uploadRecord.id);
    }

    setUploadRecord(null);
    onUploadRecordChange?.(null);
  };

  return (
    <div className={cn('space-y-wilms-3', className)}>
      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept={accept}
        disabled={disabled || isUploading}
        className="sr-only"
        aria-describedby={helperId}
        onChange={handleInputChange}
      />

      {value ? (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {previewUrl && isPreviewableImage(value.type) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`Preview of ${value.name}`}
              className="mx-auto max-h-64 w-full object-contain"
            />
          ) : (
            <div className="px-wilms-4 py-wilms-6 text-center text-small text-text-muted">
              {value.name} ({Math.round(value.size / 1024)} KB)
            </div>
          )}
          <div className="border-t border-border px-wilms-3 py-wilms-2 text-small text-text-muted">
            {uploadRecord ? 'Uploaded' : 'Selected'} · {value.name}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'rounded-sm border border-dashed bg-background px-wilms-4 py-wilms-6 text-center',
            showError ? 'border-danger' : 'border-border',
          )}
        >
          <p className="text-body font-semibold text-text-primary">{label}</p>
          <p id={helperId} className="mt-wilms-1 text-small text-text-muted">
            Upload a PDF or image file. Maximum size depends on server policy.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-wilms-2 sm:flex-row">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {value ? 'Replace file' : 'Upload file'}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => void handleRemove()}
          >
            Remove
          </Button>
        ) : null}
      </div>

      {displayError ? (
        <p className="text-small text-danger" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
