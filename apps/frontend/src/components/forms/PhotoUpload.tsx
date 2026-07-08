'use client';

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { PhoneCaptureSessionPanel } from '@/components/forms/PhoneCaptureSessionPanel';
import { WebcamCapture } from '@/components/forms/WebcamCapture';
import type { UploadPurpose, UploadRecord } from '@/types/upload';
import { deleteUploadedFile, uploadFileViaService } from '@/utils/upload-file';
import { validateBorrowerPhoto } from '@/utils/photo-validation';
import { cn } from '@/utils/cn';

export interface PhotoUploadProps {
  id: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  onBlur?: () => void;
  hasError?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  registrationSessionId?: string;
  officerId?: string;
  captureTarget?: 'borrower' | 'guarantor';
  uploadPurpose?: UploadPurpose;
  entityId?: string;
  onUploadRecordChange?: (record: UploadRecord | null) => void;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(window.navigator.userAgent);
}

export function PhotoUpload({
  id,
  value = null,
  onChange,
  onBlur,
  hasError = false,
  error,
  disabled = false,
  className,
  registrationSessionId,
  officerId,
  captureTarget = 'borrower',
  uploadPurpose,
  entityId,
  onUploadRecordChange,
}: PhotoUploadProps) {
  const helperId = useId();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<'idle' | 'camera' | 'phone'>('idle');
  const [uploadRecord, setUploadRecord] = useState<UploadRecord | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isMobile = isMobileDevice();
  const canUsePhoneCapture = Boolean(registrationSessionId && officerId);

  useEffect(() => {
    if (!value) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      setPreviewUrl(null);
      return;
    }

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
  }, [value]);

  const displayError = error ?? localError;
  const showError = hasError || Boolean(displayError);

  const handleFileSelection = async (file: File | null) => {
    if (!file) {
      setLocalError(null);
      onChange(null);
      onBlur?.();
      return;
    }

    const validationError = validateBorrowerPhoto(file);

    if (validationError) {
      setLocalError(validationError);
      onChange(null);
      onBlur?.();
      return;
    }

    setLocalError(null);
    onChange(file);
    onBlur?.();
    setMode('idle');

    if (!uploadPurpose) {
      return;
    }

    setIsUploading(true);

    try {
      if (uploadRecord?.id) {
        await deleteUploadedFile(uploadRecord.id);
      }

      const record = await uploadFileViaService({
        file,
        purpose: uploadPurpose,
        entityId,
      });

      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }

      setUploadRecord(record);
      setPreviewUrl(record.url);
      onUploadRecordChange?.(record);
    } catch {
      setLocalError('Unable to upload photo. Try again.');
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
    setMode('idle');

    if (uploadRecord?.id) {
      await deleteUploadedFile(uploadRecord.id);
    }

    setUploadRecord(null);
    onUploadRecordChange?.(null);
  };

  const openCameraFlow = () => {
    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    setMode('camera');
  };

  const openMobileCapture = () => {
    if (!canUsePhoneCapture) {
      setLocalError('Mobile capture requires an active registration session.');
      return;
    }

    setMode('phone');
  };

  return (
    <div className={cn('space-y-wilms-3', className)}>
      <input
        ref={cameraInputRef}
        id={`${id}-camera`}
        type="file"
        accept="image/*"
        capture="user"
        disabled={disabled}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleInputChange}
      />
      <input
        ref={fileInputRef}
        id={`${id}-file`}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={handleInputChange}
      />

      {previewUrl ? (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={value ? `Preview of ${value.name}` : 'Selected passport photo preview'}
            className="mx-auto max-h-64 w-full object-contain"
          />
          <div className="border-t border-border px-wilms-3 py-wilms-2 text-small text-text-muted">
            {value?.name} ({Math.round((value?.size ?? 0) / 1024)} KB)
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'rounded-sm border border-dashed bg-background px-wilms-4 py-wilms-6 text-center',
            showError ? 'border-danger' : 'border-border',
          )}
        >
          <p className="text-body font-semibold text-text-primary">Passport-style photo</p>
          <p id={helperId} className="mt-wilms-1 text-small text-text-muted">
            {isMobile
              ? 'Take a passport-style photo with your device camera or upload an existing image.'
              : 'Use Take Photo on this device, Capture Using Mobile for a phone camera, or upload a file.'}
          </p>
        </div>
      )}

      {!previewUrl && mode === 'camera' && !isMobile ? (
        <WebcamCapture disabled={disabled || isUploading} onCapture={(file) => void handleFileSelection(file)} />
      ) : null}

      {!previewUrl && mode === 'phone' && canUsePhoneCapture ? (
        <PhoneCaptureSessionPanel
          registrationSessionId={registrationSessionId!}
          officerId={officerId!}
          target={captureTarget}
          onCaptured={(file) => void handleFileSelection(file)}
        />
      ) : null}

      <div className={cn('flex flex-col gap-wilms-2', isMobile ? '' : 'sm:flex-row')}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full sm:flex-1"
          disabled={disabled}
          aria-describedby={helperId}
          onClick={openCameraFlow}
        >
          Take photo
        </Button>
        {!isMobile ? (
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full sm:flex-1"
            disabled={disabled || !canUsePhoneCapture}
            aria-describedby={helperId}
            onClick={openMobileCapture}
          >
            Capture using mobile
          </Button>
        ) : null}
      </div>

      {!previewUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Upload photo
        </Button>
      ) : null}

      {value ? (
        <div className="flex flex-col gap-wilms-2 sm:flex-row">
          <Button type="button" variant="secondary" disabled={disabled} onClick={openCameraFlow}>
            Retake photo
          </Button>
          <Button type="button" variant="ghost" disabled={disabled || isUploading} onClick={() => void handleRemove()}>
            Remove photo
          </Button>
        </div>
      ) : null}

      {displayError ? (
        <p className="text-small text-danger" role="alert">
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
