import type { GpsCoordinates } from '@/types/payment';

export class GpsCaptureError extends Error {
  constructor(message = 'GPS access denied. Payment cannot be recorded without location.') {
    super(message);
    this.name = 'GpsCaptureError';
  }
}

export async function captureGps(): Promise<GpsCoordinates> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    throw new GpsCaptureError();
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
      },
      () => {
        reject(new GpsCaptureError());
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 0,
      },
    );
  });
}
