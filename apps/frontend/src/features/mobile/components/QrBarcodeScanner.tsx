'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/feedback/Alert';

export interface QrBarcodeScannerProps {
  onScan: (value: string) => void;
  onClose?: () => void;
  title?: string;
}

export function QrBarcodeScanner({ onScan, onClose, title = 'Scan code' }: QrBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState('');

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let frameId = 0;

    async function start() {
      if (typeof window === 'undefined') {
        return;
      }

      const Detector = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetector })
        .BarcodeDetector;

      if (!Detector) {
        setError('Camera scanning is not supported on this browser. Enter the code manually.');
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled || !videoRef.current) {
          return;
        }

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const detector = new Detector({ formats: ['qr_code', 'code_128', 'ean_13'] });

        const scan = async () => {
          if (cancelled || !videoRef.current) {
            return;
          }

          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              onScan(value);
              return;
            }
          } catch {
            // Continue scanning frames.
          }

          frameId = window.requestAnimationFrame(() => {
            void scan();
          });
        };

        void scan();
      } catch {
        setError('Unable to access the camera. Check permissions or enter the code manually.');
      }
    }

    void start();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }
    };
  }, [onScan]);

  return (
    <div className="space-y-wilms-4">
      <div className="flex items-center justify-between gap-wilms-3">
        <h3 className="text-heading-3 font-semibold text-text-primary">{title}</h3>
        {onClose ? (
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
        ) : null}
      </div>

      {error ? (
        <Alert title="Scanner unavailable" variant="warning">
          {error}
        </Alert>
      ) : (
        <video
          ref={videoRef}
          className="aspect-video w-full rounded-sm border border-border bg-black object-cover"
          muted
          playsInline
        />
      )}

      <div className="space-y-wilms-2">
        <label className="text-small font-semibold text-text-primary" htmlFor="manual-scan-input">
          Enter code manually
        </label>
        <div className="flex gap-wilms-2">
          <input
            id="manual-scan-input"
            className="flex-1 rounded-sm border border-border bg-background px-wilms-3 py-wilms-2 text-body"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="BWR-2026-000001"
          />
          <Button
            type="button"
            disabled={!manualValue.trim()}
            onClick={() => onScan(manualValue.trim())}
          >
            Lookup
          </Button>
        </div>
      </div>
    </div>
  );
}

interface BarcodeDetector {
  detect(source: ImageBitmapSource): Promise<Array<{ rawValue?: string }>>;
}
