'use client';

import { useEffect, useState } from 'react';
import { SignaturePad } from '@/components/forms/SignaturePad';
import { Button } from '@/components/ui/Button';
import { UPLOAD_PURPOSE } from '@/types/upload';
import {
  deleteUploadedFile,
  resolveUploadPreviewUrl,
  uploadDataUrlViaService,
} from '@/utils/upload-file';
import { cn } from '@/utils/cn';

export interface SignatureUploadFieldProps {
  id: string;
  label: string;
  uploadId?: string;
  onUploadIdChange: (uploadId: string) => void;
  disabled?: boolean;
  optional?: boolean;
  className?: string;
  entityId?: string;
}

type CapturePhase = 'capture' | 'preview';

export function SignatureUploadField({
  id,
  label,
  uploadId,
  onUploadIdChange,
  disabled = false,
  optional = false,
  className,
  entityId,
}: SignatureUploadFieldProps) {
  const [phase, setPhase] = useState<CapturePhase>(uploadId ? 'preview' : 'capture');
  const [draftValue, setDraftValue] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!uploadId) {
      setPreviewUrl(null);
      return;
    }

    void resolveUploadPreviewUrl(uploadId).then((url) => {
      if (!cancelled) {
        setPreviewUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [uploadId]);

  const handleConfirm = async () => {
    if (!draftValue) {
      return;
    }

    setIsUploading(true);
    setLocalError(null);

    try {
      if (uploadId) {
        await deleteUploadedFile(uploadId);
      }

      const record = await uploadDataUrlViaService({
        dataUrl: draftValue,
        fileName: `${id}-signature.png`,
        purpose: UPLOAD_PURPOSE.SIGNATURE,
        entityId,
      });

      onUploadIdChange(record.id);
      setPreviewUrl(record.url);
      setDraftValue('');
      setPhase('preview');
    } catch {
      setLocalError('Unable to upload signature. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = async () => {
    setLocalError(null);
    setDraftValue('');

    if (uploadId) {
      await deleteUploadedFile(uploadId);
      onUploadIdChange('');
    }

    setPreviewUrl(null);
    setPhase('capture');
  };

  if (phase === 'preview' && uploadId && previewUrl) {
    return (
      <div className={cn('space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4', className)}>
        <p className="text-small font-semibold text-text-primary">{label}</p>
        <p className="text-small font-semibold uppercase tracking-wide text-brand-primary">Captured Signature</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={`${label} signature`}
          className="h-24 w-full rounded-sm border border-border bg-background object-contain"
        />
        <Button type="button" variant="secondary" size="sm" disabled={disabled || isUploading} onClick={() => void handleRetake()}>
          Retake
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4', className)}>
      <SignaturePad
        id={id}
        label={label}
        optional={optional}
        value={draftValue}
        disabled={disabled || isUploading}
        onChange={setDraftValue}
      />
      <div className="flex flex-wrap gap-wilms-2 border-t border-border pt-wilms-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={disabled || isUploading || !draftValue}
          onClick={() => void handleConfirm()}
        >
          {isUploading ? 'Uploading...' : 'Confirm'}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled || isUploading} onClick={() => void handleRetake()}>
          Clear
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
