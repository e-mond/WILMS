'use client';

import { useEffect, useRef, useState } from 'react';
import { SignaturePad } from '@/components/forms/SignaturePad';
import { Button } from '@/components/ui/Button';
import { UPLOAD_PURPOSE } from '@/types/upload';
import {
  deleteUploadedFile,
  resolveUploadPreviewUrl,
  uploadDataUrlViaService,
  uploadFileViaService,
} from '@/utils/upload-file';
import { cn } from '@/utils/cn';

export type IdentityCaptureMode = 'signature' | 'thumbprint';

export interface IdentityCaptureFieldProps {
  id: string;
  label: string;
  signatureUploadId?: string;
  thumbprintUploadId?: string;
  manualThumbprintPlaceholder?: boolean;
  onSignatureUploadIdChange: (uploadId: string) => void;
  onThumbprintUploadIdChange: (uploadId: string) => void;
  onManualThumbprintPlaceholderChange: (enabled: boolean) => void;
  disabled?: boolean;
  optional?: boolean;
  className?: string;
  entityId?: string;
}

type CapturePhase = 'capture' | 'preview';

export function IdentityCaptureField({
  id,
  label,
  signatureUploadId,
  thumbprintUploadId,
  manualThumbprintPlaceholder = false,
  onSignatureUploadIdChange,
  onThumbprintUploadIdChange,
  onManualThumbprintPlaceholderChange,
  disabled = false,
  optional = false,
  className,
  entityId,
}: IdentityCaptureFieldProps) {
  const [mode, setMode] = useState<IdentityCaptureMode>(
    thumbprintUploadId || manualThumbprintPlaceholder ? 'thumbprint' : 'signature',
  );
  const [phase, setPhase] = useState<CapturePhase>(
    signatureUploadId || thumbprintUploadId || manualThumbprintPlaceholder ? 'preview' : 'capture',
  );
  const [draftValue, setDraftValue] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeUploadId = mode === 'signature' ? signatureUploadId : thumbprintUploadId;

  useEffect(() => {
    let cancelled = false;

    if (manualThumbprintPlaceholder && mode === 'thumbprint') {
      setPreviewUrl(null);
      return;
    }

    if (!activeUploadId) {
      setPreviewUrl(null);
      return;
    }

    void resolveUploadPreviewUrl(activeUploadId).then((url) => {
      if (!cancelled) {
        setPreviewUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeUploadId, manualThumbprintPlaceholder, mode]);

  const handleConfirm = async () => {
    if (manualThumbprintPlaceholder && mode === 'thumbprint') {
      onManualThumbprintPlaceholderChange(true);
      onSignatureUploadIdChange('');
      onThumbprintUploadIdChange('');
      setPhase('preview');
      return;
    }

    if (!draftValue) {
      return;
    }

    setIsUploading(true);
    setLocalError(null);

    try {
      onManualThumbprintPlaceholderChange(false);

      if (mode === 'signature') {
        if (signatureUploadId) {
          await deleteUploadedFile(signatureUploadId);
        }
        if (thumbprintUploadId) {
          await deleteUploadedFile(thumbprintUploadId);
        }

        const record = await uploadDataUrlViaService({
          dataUrl: draftValue,
          fileName: `${id}-signature.png`,
          purpose: UPLOAD_PURPOSE.SIGNATURE,
          entityId,
        });

        onSignatureUploadIdChange(record.id);
        onThumbprintUploadIdChange('');
        setPreviewUrl(record.url);
      } else {
        if (thumbprintUploadId) {
          await deleteUploadedFile(thumbprintUploadId);
        }
        if (signatureUploadId) {
          await deleteUploadedFile(signatureUploadId);
        }

        const record = await uploadDataUrlViaService({
          dataUrl: draftValue,
          fileName: `${id}-thumbprint.png`,
          purpose: UPLOAD_PURPOSE.THUMBPRINT,
          entityId,
        });

        onThumbprintUploadIdChange(record.id);
        onSignatureUploadIdChange('');
        setPreviewUrl(record.url);
      }

      setDraftValue('');
      setPhase('preview');
    } catch {
      setLocalError('Unable to upload capture. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = async () => {
    setLocalError(null);
    setDraftValue('');
    onManualThumbprintPlaceholderChange(false);

    if (signatureUploadId) {
      await deleteUploadedFile(signatureUploadId);
      onSignatureUploadIdChange('');
    }

    if (thumbprintUploadId) {
      await deleteUploadedFile(thumbprintUploadId);
      onThumbprintUploadIdChange('');
    }

    setPreviewUrl(null);
    setPhase('capture');
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploading(true);
    setLocalError(null);

    try {
      onManualThumbprintPlaceholderChange(false);

      if (thumbprintUploadId) {
        await deleteUploadedFile(thumbprintUploadId);
      }
      if (signatureUploadId) {
        await deleteUploadedFile(signatureUploadId);
      }

      const record = await uploadFileViaService({
        file,
        purpose: UPLOAD_PURPOSE.THUMBPRINT,
        entityId,
      });

      onThumbprintUploadIdChange(record.id);
      onSignatureUploadIdChange('');
      setPreviewUrl(record.url);
      setDraftValue('');
      setPhase('preview');
    } catch {
      setLocalError('Unable to upload fingerprint image. Try again.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleManualPlaceholder = () => {
    setDraftValue('');
    onManualThumbprintPlaceholderChange(true);
    onThumbprintUploadIdChange('');
    onSignatureUploadIdChange('');
    setPreviewUrl(null);
    setPhase('preview');
  };

  const previewLabel = mode === 'signature' ? 'Captured Signature' : 'Captured Thumbprint';
  const hasConfirmedCapture = Boolean(
    signatureUploadId || thumbprintUploadId || manualThumbprintPlaceholder,
  );

  if (phase === 'preview' && hasConfirmedCapture) {
    return (
      <div className={cn('space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4', className)}>
        <p className="text-small font-semibold text-text-primary">{label}</p>
        <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">{previewLabel}</p>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={previewLabel}
            className="h-24 w-full rounded-sm border border-border bg-background object-contain"
          />
        ) : (
          <p className="rounded-sm border border-dashed border-border bg-background px-wilms-3 py-wilms-4 text-center text-small text-text-muted">
            Thumbprint to be applied on printed copy
          </p>
        )}
        <Button type="button" variant="secondary" size="sm" disabled={disabled || isUploading} onClick={() => void handleRetake()}>
          Retake
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4', className)}>
      <div className="flex flex-wrap items-center justify-between gap-wilms-2">
        <p className="text-small font-semibold text-text-primary">
          {label}
          {optional ? <span className="font-normal text-text-muted"> (optional)</span> : null}
        </p>
        <div className="flex rounded-sm border border-border p-0.5" role="tablist" aria-label={`${label} capture mode`}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signature'}
            disabled={disabled || isUploading}
            className={cn(
              'rounded-sm px-wilms-3 py-wilms-1 text-small font-semibold',
              mode === 'signature'
                ? 'bg-brand-primary text-card'
                : 'text-text-muted hover:text-text-primary',
            )}
            onClick={() => setMode('signature')}
          >
            Signature
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'thumbprint'}
            disabled={disabled || isUploading}
            className={cn(
              'rounded-sm px-wilms-3 py-wilms-1 text-small font-semibold',
              mode === 'thumbprint'
                ? 'bg-brand-primary text-card'
                : 'text-text-muted hover:text-text-primary',
            )}
            onClick={() => setMode('thumbprint')}
          >
            Thumbprint
          </button>
        </div>
      </div>

      {mode === 'signature' ? (
        <SignaturePad
          id={id}
          label="Draw signature (mouse, stylus, or touch)"
          optional={optional}
          value={draftValue}
          disabled={disabled || isUploading}
          onChange={setDraftValue}
        />
      ) : (
        <div className="space-y-wilms-3">
          <SignaturePad
            id={`${id}-touch`}
            label="Touch capture (mobile)"
            optional={optional}
            value={draftValue}
            disabled={disabled || isUploading}
            onChange={setDraftValue}
          />
          <div className="flex flex-wrap gap-wilms-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload fingerprint image"
              onChange={(event) => void handleUpload(event)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload fingerprint image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || isUploading}
              onClick={handleManualPlaceholder}
            >
              Manual placeholder
            </Button>
          </div>
          {draftValue ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={draftValue}
              alt="Thumbprint preview"
              className="h-24 w-full rounded-sm border border-border bg-background object-contain"
            />
          ) : null}
        </div>
      )}

      <div className="flex flex-wrap gap-wilms-2 border-t border-border pt-wilms-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={
            disabled ||
            isUploading ||
            (!draftValue && !(manualThumbprintPlaceholder && mode === 'thumbprint'))
          }
          onClick={() => void handleConfirm()}
        >
          {isUploading ? 'Uploading...' : 'Confirm'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled || isUploading} onClick={() => void handleRetake()}>
          Retake
        </Button>
      </div>
      {localError ? (
        <p className="text-small text-danger" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
