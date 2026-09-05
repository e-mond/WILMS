'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { PhoneCaptureSessionPanel } from '@/components/forms/PhoneCaptureSessionPanel';
import { WebcamCapture } from '@/components/forms/WebcamCapture';
import type { UploadPurpose, UploadRecord } from '@/types/upload';
import {
  deleteUploadedFile,
  isQueuedUpload,
  uploadFileWithOfflineQueue,
} from '@/utils/upload-file';
import { cn } from '@/utils/cn';
import { resolveMediaPreviewUrl } from '@/utils/media-preview';

const DEFAULT_ACCEPT = 'image/*,application/pdf';
const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const DOCUMENT_CAMERA_DENIED_MESSAGE =
  'Camera access was denied. You can allow camera access in your browser settings or upload the document instead.';

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
  registrationSessionId?: string;
  officerId?: string;
  onUploadRecordChange?: (record: UploadRecord | null) => void;
}

function isPreviewableImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

function validateDocumentFile(file: File): string | null {
  if (file.size <= 0) {
    return 'File must not be empty.';
  }

  const mime = (file.type || '').toLowerCase();
  if (!mime) {
    return 'Unable to determine file type. Upload a PDF or image file.';
  }

  if (
    ALLOWED_DOCUMENT_MIME_TYPES.has(mime) ||
    (mime.startsWith('image/') && mime !== 'image/svg+xml')
  ) {
    return null;
  }

  return 'Upload a PDF or image file (JPEG, PNG, WebP, or GIF).';
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
  registrationSessionId,
  officerId,
  onUploadRecordChange,
}: DocumentUploadProps) {
  const helperId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [localPreviewFile, setLocalPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadRecord, setUploadRecord] = useState<UploadRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [mode, setMode] = useState<'idle' | 'scan' | 'phone'>('idle');
  const isMobile = isMobileDevice();
  const canUsePhoneCapture = Boolean(registrationSessionId && officerId);
  const displayFile = value ?? localPreviewFile;

  useEffect(() => {
    if (!displayFile) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

    if (isPreviewableImage(displayFile.type)) {
      const objectUrl = resolveMediaPreviewUrl(displayFile);
      if (!objectUrl) {
        setPreviewUrl(uploadRecord?.url ?? null);
        return;
      }

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
      blobUrlRef.current = objectUrl.startsWith('blob:') ? objectUrl : null;
      setPreviewUrl(objectUrl);
      return () => {
        if (blobUrlRef.current === objectUrl) {
          URL.revokeObjectURL(objectUrl);
          blobUrlRef.current = null;
        }
      };
    }

    setPreviewUrl(uploadRecord?.url ?? null);
  }, [displayFile, uploadRecord?.url]);

  const displayError = error ?? localError;
  const showError = hasError || Boolean(displayError);

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setLocalError(null);
      setLocalPreviewFile(null);
      onChange(null);
      onBlur?.();
      setMode('idle');
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setLocalError(validationError);
      setLocalPreviewFile(null);
      onChange(null);
      onBlur?.();
      setMode('idle');
      return;
    }

    setLocalError(null);
    setMode('idle');

    if (!uploadPurpose) {
      setLocalPreviewFile(null);
      onChange(file);
      onBlur?.();
      return;
    }

    // Preview locally while upload runs; only commit to the form after persistence succeeds.
    setLocalPreviewFile(file);
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
        setLocalPreviewFile(null);
        onChange(file);
        onBlur?.();
        return;
      }

      setUploadRecord(result);
      if (isPreviewableImage(file.type)) {
        setPreviewUrl(result.url);
      }
      onUploadRecordChange?.(result);
      setLocalPreviewFile(null);
      onChange(file);
      onBlur?.();
    } catch {
      setLocalError('Unable to upload document. Try again or choose a different file.');
      setUploadRecord(null);
      onUploadRecordChange?.(null);
      setLocalPreviewFile(null);
      onChange(null);
      onBlur?.();
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
    setLocalPreviewFile(null);
    onChange(null);
    onBlur?.();
    setMode('idle');

    if (uploadRecord?.id) {
      await deleteUploadedFile(uploadRecord.id);
    }

    setUploadRecord(null);
    onUploadRecordChange?.(null);
  };

  const openScanFlow = () => {
    setLocalError(null);

    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setLocalError(
        'Camera capture is not available on this device. Please upload the document instead.',
      );
      return;
    }

    setMode('scan');
  };

  const openMobileCapture = () => {
    if (!canUsePhoneCapture) {
      setLocalError('Mobile capture requires an active registration session.');
      return;
    }

    setLocalError(null);
    setMode('phone');
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
      <input
        ref={cameraInputRef}
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled || isUploading}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {displayFile ? (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {previewUrl && isPreviewableImage(displayFile.type) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={`Preview of ${displayFile.name}`}
              className="mx-auto max-h-64 w-full object-contain"
            />
          ) : (
            <div className="px-wilms-4 py-wilms-6 text-center text-small text-text-muted">
              {displayFile.name} ({Math.round(displayFile.size / 1024)} KB)
            </div>
          )}
          <div className="border-t border-border px-wilms-3 py-wilms-2 text-small text-text-muted">
            {isUploading
              ? 'Uploading…'
              : uploadRecord
                ? 'Uploaded'
                : 'Selected'}{' '}
            · {displayFile.name}
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
            Upload a PDF or image, scan with this device, or capture using mobile. Maximum size
            depends on server policy.
          </p>
        </div>
      )}

      {!displayFile && mode === 'scan' && !isMobile ? (
        <WebcamCapture
          disabled={disabled || isUploading}
          facingMode="environment"
          idleHint="Open the camera to scan the ID document."
          onCapture={(file) => void handleFileSelection(file)}
          onUnavailable={() => {
            setMode('idle');
            setLocalError(
              'Camera capture is not available on this device. Please upload the document instead.',
            );
          }}
          onPermissionDenied={() => {
            setMode('idle');
            setLocalError(DOCUMENT_CAMERA_DENIED_MESSAGE);
          }}
        />
      ) : null}

      {!displayFile && mode === 'phone' && canUsePhoneCapture ? (
        <PhoneCaptureSessionPanel
          registrationSessionId={registrationSessionId!}
          officerId={officerId!}
          target="id_document"
          onCaptured={(file) => void handleFileSelection(file)}
        />
      ) : null}

      <div className="flex flex-col gap-wilms-2 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full sm:w-auto"
          disabled={disabled || isUploading}
          onClick={() => {
            setMode('idle');
            fileInputRef.current?.click();
          }}
        >
          {displayFile ? 'Replace file' : 'Upload file'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          disabled={disabled || isUploading}
          onClick={openScanFlow}
        >
          {displayFile ? 'Rescan document' : 'Scan document'}
        </Button>
        {!isMobile ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
            disabled={disabled || isUploading || !canUsePhoneCapture}
            onClick={openMobileCapture}
          >
            Capture using mobile
          </Button>
        ) : null}
        {displayFile ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full sm:w-auto"
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
