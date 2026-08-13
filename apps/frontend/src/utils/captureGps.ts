import type { GpsCoordinates, GpsDeviceMetadata, GpsException, GpsFix } from '@/types/gps';

export class GpsCaptureError extends Error {
  constructor(message = 'GPS is unavailable. Confirm the exception and record a reason to continue.') {
    super(message);
    this.name = 'GpsCaptureError';
  }
}

export function captureDeviceMetadata(): GpsDeviceMetadata {
  if (typeof navigator === 'undefined') {
    return {};
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
  };
}

export async function captureGps(): Promise<GpsFix> {
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
          device: captureDeviceMetadata(),
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

export function buildGpsException(reason: string, collectorId?: string): GpsException {
  return {
    unavailable: true,
    reason: reason.trim(),
    capturedAt: new Date().toISOString(),
    collectorId,
    device: captureDeviceMetadata(),
  };
}

export async function captureGpsOrException(): Promise<GpsCoordinates> {
  try {
    return await captureGps();
  } catch (error) {
    if (error instanceof GpsCaptureError) {
      throw error;
    }
    throw new GpsCaptureError();
  }
}
