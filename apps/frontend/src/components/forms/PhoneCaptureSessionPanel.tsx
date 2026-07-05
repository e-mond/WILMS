'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { photoCaptureSessionService } from '@/services';
import type { PhotoCaptureSession } from '@/types/photo-capture-session';
import { resolveUploadPreviewUrl } from '@/utils/upload-file';
import { cn } from '@/utils/cn';

export interface PhoneCaptureSessionPanelProps {
  registrationSessionId: string;
  officerId: string;
  target: 'borrower' | 'guarantor';
  onCaptured: (file: File) => void;
  className?: string;
}

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header?.match(/:(.*?);/);
  const mime = mimeMatch?.[1] ?? 'image/jpeg';
  const binary = atob(base64 ?? '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

async function resolveCapturedFile(session: PhotoCaptureSession): Promise<File | null> {
  const fileName = session.capturedFileName ?? `${session.sessionToken}.jpg`;

  if (session.capturedDataUrl) {
    return dataUrlToFile(session.capturedDataUrl, fileName);
  }

  if (session.uploadId) {
    const previewUrl = await resolveUploadPreviewUrl(session.uploadId);
    if (previewUrl) {
      const response = await fetch(previewUrl);
      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return new File([blob], fileName, {
        type: session.capturedMimeType ?? blob.type ?? 'image/jpeg',
      });
    }
  }

  if (session.previewUrl) {
    const resolvedUrl = session.previewUrl.startsWith('/uploads/')
      ? `/api/wilms${session.previewUrl}`
      : session.previewUrl;
    const response = await fetch(resolvedUrl);
    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return new File([blob], fileName, {
      type: session.capturedMimeType ?? blob.type ?? 'image/jpeg',
    });
  }

  return null;
}

export function PhoneCaptureSessionPanel({
  registrationSessionId,
  officerId,
  target,
  onCaptured,
  className,
}: PhoneCaptureSessionPanelProps) {
  const helperId = useId();
  const [session, setSession] = useState<PhotoCaptureSession | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.status === 'CAPTURED') {
      return;
    }

    let cancelled = false;

    const interval = window.setInterval(() => {
      void photoCaptureSessionService.getSession(session.sessionToken).then(async (next) => {
        if (!next || cancelled) {
          return;
        }

        setSession(next);

        if (next.status !== 'CAPTURED') {
          return;
        }

        const file = await resolveCapturedFile(next);
        if (file) {
          onCaptured(file);
        } else {
          setCaptureError('Photo uploaded but preview is not available yet. Try again in a moment.');
        }
      });
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session, onCaptured]);

  const createSession = async () => {
    setIsCreating(true);
    setCaptureError(null);

    try {
      const created = await photoCaptureSessionService.createSession({
        registrationSessionId,
        officerId,
        target,
      });
      setSession(created);
    } finally {
      setIsCreating(false);
    }
  };

  const simulatePhoneCapture = async () => {
    if (!session) {
      return;
    }

    setIsSimulating(true);
    setCaptureError(null);

    try {
      const placeholder =
        'data:image/svg+xml;base64,' +
        btoa(
          `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" fill="#D4AF37" font-size="20" text-anchor="middle">WILMS Phone Capture</text></svg>`,
        );

      const updated = await photoCaptureSessionService.simulatePhoneCapture(
        session.sessionToken,
        placeholder,
      );
      setSession(updated);

      const file = await resolveCapturedFile(updated);
      if (file) {
        onCaptured(file);
      }
    } catch (error) {
      setCaptureError(
        error instanceof Error ? error.message : 'Unable to complete simulated phone capture.',
      );
    } finally {
      setIsSimulating(false);
    }
  };

  const qrImageUrl = session
    ? `https://quickchart.io/qr?size=180&text=${encodeURIComponent(session.captureUrl)}`
    : null;

  return (
    <section
      aria-labelledby={helperId}
      className={cn('space-y-wilms-3 rounded-sm border border-border bg-card p-wilms-4', className)}
    >
      <div>
        <h3 id={helperId} className="text-body font-semibold text-text-primary">
          Capture using mobile
        </h3>
        <p className="mt-wilms-1 text-small text-text-muted">
          Scan the QR code with a mobile device to open the secure camera session. The registration
          preview updates automatically when the photo upload completes.
        </p>
      </div>

      {captureError ? (
        <p className="text-small text-danger" role="alert">
          {captureError}
        </p>
      ) : null}

      {!session ? (
        <Button type="button" variant="secondary" disabled={isCreating} onClick={() => void createSession()}>
          Generate secure capture link
        </Button>
      ) : (
        <div className="grid gap-wilms-4 md:grid-cols-[180px_minmax(0,1fr)]">
          {qrImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrImageUrl} alt="QR code for secure photo capture" className="mx-auto rounded-sm border border-border" />
          ) : null}
          <dl className="space-y-wilms-2 text-small">
            <div>
              <dt className="font-semibold text-text-muted">Session token</dt>
              <dd className="break-all font-mono text-text-primary">{session.sessionToken}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Secure link</dt>
              <dd className="break-all text-text-primary">{session.captureUrl}</dd>
            </div>
            <div>
              <dt className="font-semibold text-text-muted">Status</dt>
              <dd className="text-text-primary">{session.status}</dd>
            </div>
          </dl>
        </div>
      )}

      {session?.status === 'PENDING' ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isSimulating}
          onClick={() => void simulatePhoneCapture()}
        >
          {isSimulating ? 'Simulating capture…' : 'Simulate phone capture'}
        </Button>
      ) : null}
    </section>
  );
}
