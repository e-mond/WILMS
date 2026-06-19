'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

export interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onUnavailable?: () => void;
  disabled?: boolean;
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

export function WebcamCapture({
  onCapture,
  onUnavailable,
  disabled = false,
  className,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsActive(false);
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  const startCamera = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not available on this device');
      onUnavailable?.();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setPreviewUrl(null);
    } catch {
      setError('Camera not available on this device');
      onUnavailable?.();
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreviewUrl(dataUrl);
    stopStream();
  };

  const saveCapture = () => {
    if (!previewUrl) {
      return;
    }

    onCapture(dataUrlToFile(previewUrl, `capture-${Date.now()}.jpg`));
  };

  const retake = () => {
    setPreviewUrl(null);
    void startCamera();
  };

  return (
    <div className={cn('space-y-wilms-3', className)}>
      {error ? (
        <p className="rounded-sm border border-status-at-risk bg-status-at-risk-light px-wilms-3 py-wilms-2 text-body text-text-primary">
          {error}
        </p>
      ) : null}

      {!previewUrl ? (
        <div className="overflow-hidden rounded-sm border border-border bg-background">
          <video
            ref={videoRef}
            className={cn('mx-auto max-h-64 w-full object-contain', !isActive && 'hidden')}
            playsInline
            muted
            aria-label="Camera preview"
          />
          {!isActive ? (
            <div className="px-wilms-4 py-wilms-8 text-center text-small text-text-muted">
              Open the camera to capture a passport-style photo.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="overflow-hidden rounded-sm border border-border bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Captured photo preview"
            className="mx-auto max-h-64 w-full object-contain"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-wilms-2">
        {!isActive && !previewUrl ? (
          <Button type="button" variant="primary" disabled={disabled} onClick={() => void startCamera()}>
            Open camera
          </Button>
        ) : null}
        {isActive && !previewUrl ? (
          <Button type="button" variant="primary" disabled={disabled} onClick={captureFrame}>
            Capture photo
          </Button>
        ) : null}
        {previewUrl ? (
          <>
            <Button type="button" variant="primary" disabled={disabled} onClick={saveCapture}>
              Save photo
            </Button>
            <Button type="button" variant="secondary" disabled={disabled} onClick={retake}>
              Retake
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
