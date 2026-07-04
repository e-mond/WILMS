'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { photoCaptureSessionService } from '@/services';
import type { PhotoCaptureSession } from '@/types/photo-capture-session';
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

  useEffect(() => {
    if (!session || session.status === 'CAPTURED') {
      return;
    }

    const interval = window.setInterval(() => {
      void photoCaptureSessionService.getSession(session.sessionToken).then((next) => {
        if (!next) {
          return;
        }

        setSession(next);

        if (next.status === 'CAPTURED' && (next.capturedDataUrl || next.previewUrl)) {
          if (next.capturedDataUrl) {
            onCaptured(
              dataUrlToFile(next.capturedDataUrl, next.capturedFileName ?? `${next.sessionToken}.jpg`),
            );
            return;
          }

          if (next.previewUrl) {
            void fetch(next.previewUrl)
              .then((response) => response.blob())
              .then((blob) => {
                onCaptured(
                  new File([blob], next.capturedFileName ?? `${next.sessionToken}.jpg`, {
                    type: next.capturedMimeType ?? blob.type ?? 'image/jpeg',
                  }),
                );
              });
          }
        }
      });
    }, 2000);

    return () => window.clearInterval(interval);
  }, [session, onCaptured]);

  const createSession = async () => {
    setIsCreating(true);

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

    const placeholder =
      'data:image/svg+xml;base64,' +
      btoa(
        `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400"><rect width="100%" height="100%" fill="#111827"/><text x="50%" y="50%" fill="#D4AF37" font-size="20" text-anchor="middle">WILMS Phone Capture</text></svg>`,
      );

    await photoCaptureSessionService.simulatePhoneCapture(session.sessionToken, placeholder);
    const updated = await photoCaptureSessionService.getSession(session.sessionToken);

    if (updated?.capturedDataUrl) {
      setSession(updated);
      onCaptured(
        dataUrlToFile(updated.capturedDataUrl, updated.capturedFileName ?? `${updated.sessionToken}.jpg`),
      );
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
        <Button type="button" variant="ghost" size="sm" onClick={() => void simulatePhoneCapture()}>
          Simulate phone capture (development)
        </Button>
      ) : null}
    </section>
  );
}
