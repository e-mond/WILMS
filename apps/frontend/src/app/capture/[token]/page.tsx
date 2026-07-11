'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';
import { extractApiErrorMessage } from '@/lib/api/error-body';

interface CaptureSession {
  sessionToken: string;
  status: 'PENDING' | 'CAPTURED' | 'EXPIRED';
  expiresAt: string;
  previewUrl?: string;
}

function resolveCaptureLoadError(status: number, payload: unknown): string {
  const message = extractApiErrorMessage(payload);

  if (status === 503) {
    return (
      message ??
      'Photo capture is temporarily unavailable. The server database is not configured.'
    );
  }

  if (status === 404) {
    return 'Capture session not found. Request a new QR code from the registration officer.';
  }

  if (status === 401 || status === 403) {
    return 'Capture session could not be verified. Request a new QR code and try again.';
  }

  return message ?? 'Capture session not found or expired.';
}

export default function MobileCapturePage({ params }: { params: { token: string } }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [session, setSession] = useState<CaptureSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void fetch(`/api/wilms/photo-capture/sessions/${params.token}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as unknown;

        if (!response.ok) {
          throw new Error(resolveCaptureLoadError(response.status, payload));
        }

        const body = payload as { data?: CaptureSession };
        if (!cancelled) {
          setSession(body.data ?? null);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Unable to load capture session.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.token]);

  useEffect(() => {
    if (session?.status !== 'PENDING' || completed) {
      return;
    }

    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setError('Camera access is required to capture a photo.');
      });

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [session, completed]);

  const captureAndUpload = async () => {
    const video = videoRef.current;
    if (!video || !session) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext('2d');
    if (!context) {
      setError('Unable to capture photo.');
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const sizeBytes = Math.ceil((dataUrl.length * 3) / 4);

    setUploading(true);
    setError(null);

    try {
      const response = await fetch(`/api/wilms/photo-capture/sessions/${params.token}/upload`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          purpose: 'borrower-photo',
          fileName: `${params.token}.jpg`,
          mimeType: 'image/jpeg',
          sizeBytes,
          dataUrl,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as unknown;
        throw new Error(extractApiErrorMessage(payload) ?? 'Upload failed. Please try again.');
      }

      setCompleted(true);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-wilms-4 p-wilms-4">
        <Alert variant="error" title="Capture unavailable">
          {error}
        </Alert>
      </main>
    );
  }

  if (completed || session?.status === 'CAPTURED') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-wilms-4 p-wilms-4 text-center">
        <h1 className="text-heading-3 font-semibold text-text-primary">Photo captured</h1>
        <p className="text-body text-text-muted">Return to the registration form on your desktop device.</p>
      </main>
    );
  }

  if (session?.status === 'EXPIRED') {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-wilms-4 p-wilms-4">
        <Alert variant="warning" title="Session expired">
          Request a new QR code from the registration officer.
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-wilms-4 p-wilms-4">
      <div>
        <h1 className="text-heading-3 font-semibold text-text-primary">Secure photo capture</h1>
        <p className="text-body text-text-muted">Position the subject in frame, then capture and upload.</p>
      </div>
      <div className="overflow-hidden rounded-sm border border-border bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="aspect-[3/4] w-full object-cover" />
      </div>
      <Button type="button" onClick={() => void captureAndUpload()} disabled={uploading || !session}>
        {uploading ? 'Uploading…' : 'Capture and upload'}
      </Button>
    </main>
  );
}
